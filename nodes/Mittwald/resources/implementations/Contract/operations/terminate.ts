import { contractResource } from '../resource';
import Z from 'zod';

export default contractResource
	.addOperation({
		name: 'Terminate',
		action: 'Schedule the termination of a contract',
		description: 'Schedule the termination of a contract',
	})
	.withProperties({
		contractId: { displayName: 'Contract ID', type: 'string', default: '' },
		targetDate: { displayName: 'Target Date', type: 'dateTime', default: '' },
		reason: { displayName: 'Reason', type: 'string', default: '' },
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { contractId, targetDate, reason } = properties;

		return apiClient.request({
			path: `/contracts/${contractId}/termination`,
			method: 'POST',
			requestSchema: Z.object({
				terminationTargetDate: Z.string().optional(),
				reason: Z.string().optional(),
			}),
			body: {
				terminationTargetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
				reason: reason || undefined,
			},
		});
	});
