/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Server / Storage Statistics (integration)', () => {
	testcase(
		'returns storage statistics for the configured test server',
		async ({ runOperation, env }) => {
			const result = await runOperation({
				resource: 'Server',
				operation: 'Get Storage Statistics',
				parameters: {
					server: {
						mode: 'id',
						value: env.testServerId,
					},
				},
			});

			const meta = result.firstItem.json.meta;

			expect(result.firstItem.json.id).toBe(env.testServerId);
			expect(result.firstItem.json.kind).toBe('server');
			expect(meta).toEqual(expect.any(Object));
			expect(typeof (meta as Record<string, unknown>).totalUsageInBytes).toBe('number');
		},
	);
});
