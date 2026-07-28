import { contractResource } from '../resource';
import Z from 'zod';

export default contractResource
	.addOperation({
		name: 'Terminate Item',
		action: 'Schedule the termination of a contract item',
		description: 'Schedule the termination of a contract item',
	})
	.withProperties({
		contractId: {
			displayName: 'Contract ID',
			description: 'The unique identifier of the contract',
			type: 'string',
			default: '',
		},
		contractItemId: {
			displayName: 'Contract Item ID',
			description: 'The unique identifier of the contract item',
			type: 'string',
			default: '',
		},
		targetDate: {
			displayName: 'Target Date',
			description:
				'Date on which the termination takes effect; leave empty for the earliest possible date',
			type: 'dateTime',
			default: '',
		},
		reason: {
			displayName: 'Reason',
			description: 'Optional reason for the termination',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { contractId, contractItemId, targetDate, reason } = properties;

		return apiClient.request({
			path: `/contracts/${contractId}/items/${contractItemId}/termination`,
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
