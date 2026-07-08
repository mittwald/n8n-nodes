/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, readRequiredString, testcase } from './testcase';

integrationDescribe('App / read-only operations (integration)', () => {
	testcase('lists apps and fetches the first app by id', async ({ runOperation }) => {
		const listResult = await runOperation({
			resource: 'App',
			operation: 'List Apps',
		});

		expect(Array.isArray(listResult.items)).toBe(true);
		expect(listResult.items.length).toBeGreaterThan(0);

		const firstAppId = readRequiredString(listResult.firstItem.json, 'id');

		const getResult = await runOperation({
			resource: 'App',
			operation: 'Get App',
			parameters: {
				app: {
					mode: 'id',
					value: firstAppId,
				},
			},
		});

		expect(getResult.items.length).toBe(1);
		expect(readRequiredString(getResult.firstItem.json, 'id')).toBe(firstAppId);
	});

	testcase('lists system softwares', async ({ runOperation }) => {
		const result = await runOperation({
			resource: 'App',
			operation: 'List System Softwares',
		});

		expect(Array.isArray(result.items)).toBe(true);
		expect(result.items.length).toBeGreaterThan(0);
	});
});
