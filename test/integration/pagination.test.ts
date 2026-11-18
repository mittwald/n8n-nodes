import { expect } from 'vitest';
import { integrationDescribe, readRequiredString, testcase } from './testcase';

// Uses the public app catalogue (List Apps): it is read-only, the same for
// every account, and its endpoint caps unpaginated responses at 100 entries.
integrationDescribe('Pagination of List operations (integration)', () => {
	testcase('returns every entry by default and as many as the limit allows', async (context) => {
		const response = await context.mittwaldApi.app.listApps({ queryParameters: { limit: 1 } });
		expect(response.status).toBe(200);
		const totalCount = Number(response.headers['x-pagination-totalcount']);
		expect(totalCount).toBeGreaterThan(3);

		// A node without the fields (as in workflows saved before pagination) returns everything.
		const byDefault = await context.runOperation({
			resource: 'App',
			operation: 'List Apps',
		});
		expect(byDefault.items).toHaveLength(totalCount);

		const returnAll = await context.runOperation({
			resource: 'App',
			operation: 'List Apps',
			parameters: { returnAll: true },
		});
		expect(returnAll.items).toHaveLength(totalCount);

		const limited = await context.runOperation({
			resource: 'App',
			operation: 'List Apps',
			parameters: { returnAll: false, limit: 3 },
		});
		expect(limited.items.map((item) => readRequiredString(item.json, 'id'))).toEqual(
			returnAll.items.slice(0, 3).map((item) => readRequiredString(item.json, 'id')),
		);

		const limitAboveTotal = await context.runOperation({
			resource: 'App',
			operation: 'List Apps',
			parameters: { returnAll: false, limit: totalCount + 50 },
		});
		expect(limitAboveTotal.items).toHaveLength(totalCount);
	});
});
