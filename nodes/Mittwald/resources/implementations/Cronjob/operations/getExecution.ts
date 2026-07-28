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
			description: 'The unique identifier of the cronjob',
			type: 'string',
			default: '',
			required: true,
		},
		executionId: {
			displayName: 'Execution ID',
			description: 'The unique identifier of the cronjob execution',
			type: 'string',
			default: '',
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { cronjobId, executionId } = properties;

		return apiClient.request({
			path: `/cronjobs/${cronjobId}/executions/${executionId}`,
			method: 'GET',
		});
	});
