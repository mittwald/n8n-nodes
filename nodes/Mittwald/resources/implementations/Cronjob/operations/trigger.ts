import { cronjobResource } from '../resource';

export default cronjobResource
	.addOperation({
		name: 'Trigger',
		action: 'Trigger a cronjob',
		description: 'Manually trigger an execution of a cronjob',
	})
	.withProperties({
		cronjobId: {
			displayName: 'Cronjob ID',
			description: 'The unique identifier of the cronjob',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { cronjobId } = properties;

		return apiClient.request({
			path: `/cronjobs/${cronjobId}/executions`,
			method: 'POST',
		});
	});
