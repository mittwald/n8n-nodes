import { cronjobResource } from '../resource';

export default cronjobResource
	.addOperation({
		name: 'Get',
		action: 'Get a cronjob',
		description: 'Get details of a specific cronjob',
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
			path: `/cronjobs/${cronjobId}`,
			method: 'GET',
		});
	});
