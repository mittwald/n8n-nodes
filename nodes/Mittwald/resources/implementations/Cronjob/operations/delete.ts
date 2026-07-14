import { cronjobResource } from '../resource';

export default cronjobResource
	.addOperation({
		name: 'Delete',
		action: 'Delete a cronjob',
		description: 'Delete an existing cronjob',
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
			path: `/cronjobs/${cronjobId}`,
			method: 'DELETE',
		});
	});
