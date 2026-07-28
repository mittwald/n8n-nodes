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
			description: 'The unique identifier of the cronjob',
			type: 'string',
			default: '',
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { cronjobId } = properties;

		return apiClient.request({
			path: `/cronjobs/${cronjobId}`,
			method: 'DELETE',
		});
	});
