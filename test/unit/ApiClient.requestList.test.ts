import { describe, expect, it, vi } from 'vitest';
import type { IAllExecuteFunctions } from 'n8n-workflow';
import { ApiClient } from '../../nodes/Mittwald/api';

interface FakeResponse {
	body: unknown;
	headers?: Record<string, string>;
}

/** An execution context whose authenticated HTTP helper replays the given responses. */
function fakeNode(...responses: FakeResponse[]) {
	const httpRequestWithAuthentication = vi.fn();
	for (const response of responses) {
		httpRequestWithAuthentication.mockResolvedValueOnce({
			statusCode: 200,
			headers: {},
			...response,
		});
	}

	const node = {
		logger: { info: vi.fn() },
		helpers: { httpRequestWithAuthentication },
	} as unknown as IAllExecuteFunctions;

	return { node, httpRequestWithAuthentication };
}

describe('ApiClient.requestList', () => {
	it('sends skip and limit next to the caller query and follows the total count', async () => {
		const { node, httpRequestWithAuthentication } = fakeNode(
			{
				body: Array.from({ length: 100 }, (_, index) => ({ id: index })),
				headers: { 'x-pagination-totalcount': '101', 'x-pagination-limit': '100' },
			},
			{
				body: [{ id: 100 }],
				headers: { 'x-pagination-totalcount': '101', 'x-pagination-limit': '100' },
			},
		);

		const items = await new ApiClient(node).requestList({
			path: '/projects',
			qs: { serverId: 'abc' },
			pagination: { returnAll: true, limit: 50 },
		});

		expect(items).toHaveLength(101);
		expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(2);

		const [credentialName, firstRequest] = httpRequestWithAuthentication.mock.calls[0];
		expect(credentialName).toBe('mittwaldApi');
		expect(firstRequest).toMatchObject({
			method: 'GET',
			url: '/projects',
			qs: { serverId: 'abc', skip: 0, limit: 100 },
		});
		expect(httpRequestWithAuthentication.mock.calls[1][1]).toMatchObject({
			qs: { serverId: 'abc', skip: 100, limit: 100 },
		});
	});

	it('requests only the limit when returnAll is off', async () => {
		const { node, httpRequestWithAuthentication } = fakeNode({
			body: [{ id: 1 }, { id: 2 }],
			headers: { 'x-pagination-totalcount': '15', 'x-pagination-limit': '2' },
		});

		const items = await new ApiClient(node).requestList({
			path: '/apps',
			pagination: { returnAll: false, limit: 2 },
		});

		expect(items).toEqual([{ id: 1 }, { id: 2 }]);
		expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
		expect(httpRequestWithAuthentication.mock.calls[0][1]).toMatchObject({
			qs: { skip: 0, limit: 2 },
		});
	});

	it('fails when the endpoint does not return a list', async () => {
		const { node } = fakeNode({ body: { id: 'not-a-list' } });

		await expect(
			new ApiClient(node).requestList({
				path: '/projects',
				pagination: { returnAll: true, limit: 50 },
			}),
		).rejects.toThrow('GET /projects - Expected a list in the response body, got: object');
	});

	it('fails on a malformed pagination header', async () => {
		const { node } = fakeNode({
			body: [{ id: 1 }],
			headers: { 'x-pagination-totalcount': 'many' },
		});

		await expect(
			new ApiClient(node).requestList({
				path: '/projects',
				pagination: { returnAll: true, limit: 50 },
			}),
		).rejects.toThrow('Invalid or missing pagination header: x-pagination-totalcount');
	});
});
