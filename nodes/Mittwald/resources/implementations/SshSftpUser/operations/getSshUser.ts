import { sshSftpUserResource } from '../resource';

export default sshSftpUserResource
	.addOperation({
		name: 'Get SSH User',
		action: 'Get an SSH user',
		description: 'Get details of a specific SSH user',
	})
	.withProperties({
		sshUserId: {
			displayName: 'SSH User ID',
			description: 'The unique identifier of the SSH user',
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
