/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Server / Storage threshold (integration)', () => {
	testcase(
		'updates the storage notification threshold and reads it back',
		async (context) => {
			const server = { mode: 'id', value: context.env.testServerId };

			const readStatistics = async () =>
				context.runOperation({
					resource: 'Server',
					operation: 'Get Storage Statistics',
					parameters: { server },
				});

			const updateThreshold = async (notificationThresholdInBytes: number) =>
				context.runOperation({
					resource: 'Server',
					operation: 'Update Storage Notification Threshold',
					parameters: { server, notificationThresholdInBytes },
				});

			const before = await readStatistics();
			const meta = before.firstItem.json.meta;
			if (typeof meta !== 'object' || meta === null || 'limitInBytes' in meta === false) {
				throw new Error('Expected the server storage statistics to expose meta.limitInBytes');
			}
			const limitInBytes = meta.limitInBytes;
			if (typeof limitInBytes !== 'number') {
				throw new Error('Expected meta.limitInBytes to be a number');
			}

			// The field is absent until a threshold has been configured at least once,
			// so an unconfigured server falls back to its own limit on restore.
			const originalThreshold = before.firstItem.json.notificationThresholdInBytes;
			const restoreTo = typeof originalThreshold === 'number' ? originalThreshold : limitInBytes;
			context.teardown(async () => {
				await updateThreshold(restoreTo);
			});

			const newThresholdInBytes = Math.floor(limitInBytes / 2);
			await updateThreshold(newThresholdInBytes);

			const after = await readStatistics();
			expect(after.firstItem.json.notificationThresholdInBytes).toBe(newThresholdInBytes);
		},
		120_000,
	);
});
