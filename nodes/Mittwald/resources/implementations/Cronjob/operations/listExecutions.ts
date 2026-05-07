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
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { cronjobId } = properties;

		return apiClient.request({
			path: `/cronjobs/${cronjobId}/executions`,
			method: 'GET',
		});
	});
