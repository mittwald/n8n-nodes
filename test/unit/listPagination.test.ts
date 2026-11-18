import { describe, expect, it } from 'vitest';
import {
	collectListPages,
	type CollectListPagesOptions,
	type ListPage,
} from '../../nodes/Mittwald/api/listPagination';

interface FakeListOptions {
	/** Largest page the fake server hands out, whatever was requested. */
	serverCap?: number;
	/** Whether to report X-Pagination-TotalCount. */
	withTotalCount?: boolean;
	/** Whether to report X-Pagination-Limit. */
	withAppliedLimit?: boolean;
}

/** A skip/limit list endpoint over `total` numbered items that records every request. */
function fakeList(total: number, options: FakeListOptions = {}) {
	const {
		serverCap = Number.POSITIVE_INFINITY,
		withTotalCount = true,
		withAppliedLimit = true,
	} = options;
	const all = Array.from({ length: total }, (_, index) => index);
	const requests: Array<{ skip: number; limit: number }> = [];

	const fetchPage = async (window: { skip: number; limit: number }): Promise<ListPage<number>> => {
		requests.push(window);
		const appliedLimit = Math.min(window.limit, serverCap);
		return {
			items: all.slice(window.skip, window.skip + appliedLimit),
			totalCount: withTotalCount ? total : undefined,
			appliedLimit: withAppliedLimit ? appliedLimit : undefined,
		};
	};

	return { all, requests, fetchPage };
}

const defaults: CollectListPagesOptions = {
	returnAll: true,
	limit: 50,
	pageSize: 100,
	maxPages: 1000,
};

describe('collectListPages', () => {
	it('walks every page when returnAll is set', async () => {
		const api = fakeList(250);

		const items = await collectListPages(api.fetchPage, defaults);

		expect(items).toEqual(api.all);
		expect(api.requests).toEqual([
			{ skip: 0, limit: 100 },
			{ skip: 100, limit: 100 },
			{ skip: 200, limit: 100 },
		]);
	});

	it('stops after one request when the first page holds everything', async () => {
		const api = fakeList(15);

		const items = await collectListPages(api.fetchPage, defaults);

		expect(items).toEqual(api.all);
		expect(api.requests).toHaveLength(1);
	});

	it('returns an empty list for an empty endpoint', async () => {
		const api = fakeList(0);

		expect(await collectListPages(api.fetchPage, defaults)).toEqual([]);
		expect(api.requests).toHaveLength(1);
	});

	it('requests only the limit when it fits into one page', async () => {
		const api = fakeList(250);

		const items = await collectListPages(api.fetchPage, {
			...defaults,
			returnAll: false,
			limit: 7,
		});

		expect(items).toEqual(api.all.slice(0, 7));
		expect(api.requests).toEqual([{ skip: 0, limit: 7 }]);
	});

	it('spans several pages to reach a limit above the page size', async () => {
		const api = fakeList(1000);

		const items = await collectListPages(api.fetchPage, {
			...defaults,
			returnAll: false,
			limit: 250,
		});

		expect(items).toEqual(api.all.slice(0, 250));
		expect(api.requests).toEqual([
			{ skip: 0, limit: 100 },
			{ skip: 100, limit: 100 },
			{ skip: 200, limit: 50 },
		]);
	});

	it('returns everything there is when the limit exceeds the total', async () => {
		const api = fakeList(30);

		const items = await collectListPages(api.fetchPage, {
			...defaults,
			returnAll: false,
			limit: 500,
		});

		expect(items).toEqual(api.all);
		expect(api.requests).toHaveLength(1);
	});

	it('loses no items when the server caps the page size below the requested one', async () => {
		const api = fakeList(120, { serverCap: 50 });

		const items = await collectListPages(api.fetchPage, defaults);

		expect(items).toEqual(api.all);
		expect(api.requests.map((request) => request.skip)).toEqual([0, 50, 100]);
	});

	it('keeps paging a capped server without a total count, using the applied limit', async () => {
		const api = fakeList(120, { serverCap: 50, withTotalCount: false });

		const items = await collectListPages(api.fetchPage, defaults);

		expect(items).toEqual(api.all);
		expect(api.requests.map((request) => request.skip)).toEqual([0, 50, 100]);
	});

	it('stops on a short page when no pagination headers are sent at all', async () => {
		const api = fakeList(130, { withTotalCount: false, withAppliedLimit: false });

		const items = await collectListPages(api.fetchPage, defaults);

		expect(items).toEqual(api.all);
		expect(api.requests).toHaveLength(2);
	});

	it('stops on an empty page even if the total count promises more', async () => {
		const requests: number[] = [];
		const items = await collectListPages(async ({ skip }) => {
			requests.push(skip);
			return { items: skip === 0 ? [1, 2] : [], totalCount: 10 };
		}, defaults);

		expect(items).toEqual([1, 2]);
		expect(requests).toEqual([0, 2]);
	});

	it('trims a page that is larger than requested down to the limit', async () => {
		const items = await collectListPages(async () => ({ items: [1, 2, 3, 4, 5], totalCount: 5 }), {
			...defaults,
			returnAll: false,
			limit: 3,
		});

		expect(items).toEqual([1, 2, 3]);
	});

	it.each([0, -1, 1.5, Number.NaN])('rejects the invalid limit %s', async (limit) => {
		const api = fakeList(10);

		await expect(
			collectListPages(api.fetchPage, { ...defaults, returnAll: false, limit }),
		).rejects.toThrow('Limit must be a whole number of at least 1');
		expect(api.requests).toHaveLength(0);
	});

	it('ignores the limit when returnAll is set', async () => {
		const api = fakeList(10);

		const items = await collectListPages(api.fetchPage, { ...defaults, limit: 0 });

		expect(items).toEqual(api.all);
	});

	it('gives up after maxPages instead of looping forever', async () => {
		const api = fakeList(1000);

		await expect(
			collectListPages(api.fetchPage, { ...defaults, pageSize: 10, maxPages: 3 }),
		).rejects.toThrow('Stopped after 3 pages (30 items)');
		expect(api.requests).toHaveLength(3);
	});
});
