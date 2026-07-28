import { contractResource } from '../resource';
import Z from 'zod';

export default contractResource
	.addOperation({
		name: 'Terminate',
		action: 'Schedule the termination of a contract',
		description: 'Schedule the termination of a contract',
	})
	.withProperties({
		contractId: {
			displayName: 'Contract ID',
			description: 'The unique identifier of the contract',
			type: 'string',
			default: '',
			required: true,
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
