import { sshSftpUserResource } from '../resource';

export default sshSftpUserResource
	.addOperation({
		name: 'Delete SSH User',
		action: 'Delete an SSH user',
		description: 'Delete an SSH user by ID',
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
			method: 'DELETE',
		});
	});
