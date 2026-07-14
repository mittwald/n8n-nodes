import { cronjobResource } from '../resource';

export default cronjobResource
	.addOperation({
		name: 'Get Execution',
		action: 'Get a cronjob execution',
		description: 'Get details of a specific cronjob execution',
	})
	.withProperties({
		cronjobId: {
			displayName: 'Cronjob ID',
			type: 'string',
			default: '',
		},
		executionId: {
			displayName: 'Execution ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { cronjobId, executionId } = properties;

		return apiClient.request({
			path: `/cronjobs/${cronjobId}/executions/${executionId}`,
			method: 'GET',
		});
	});
