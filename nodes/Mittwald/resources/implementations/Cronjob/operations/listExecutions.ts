import { cronjobResource } from '../resource';

export default cronjobResource
	.addOperation({
		name: 'List Executions',
		action: 'List cronjob executions',
		description: 'Get a list of executions for a cronjob',
	})
	.withProperties({
		cronjobId: {
			displayName: 'Cronjob ID',
			description: 'The unique identifier of the cronjob',
			type: 'string',
			default: '',
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { cronjobId } = properties;

		return apiClient.request({
			path: `/cronjobs/${cronjobId}/executions`,
			method: 'GET',
		});
	});
