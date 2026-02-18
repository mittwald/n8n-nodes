import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Get SSH User',
		action: 'Get an SSH user',
		description: 'Get details of an SSH user by ID',
	})
	.withProperties({
		sshUserId: {
			displayName: 'SSH User ID',
			type: 'string',
			default: '',
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { sshUserId } = properties;

		return apiClient.request({
			path: `/ssh-users/${sshUserId}`,
			method: 'GET',
		});
	});
