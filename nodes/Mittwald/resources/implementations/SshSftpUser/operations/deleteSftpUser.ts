import { sshSftpUserResource } from '../resource';

export default sshSftpUserResource
	.addOperation({
		name: 'Delete SFTP User',
		action: 'Delete an SFTP user',
		description: 'Delete an SFTP user by ID',
	})
	.withProperties({
		sftpUserId: {
			displayName: 'SFTP User ID',
			description: 'The unique identifier of the SFTP user',
			type: 'string',
			default: '',
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { sftpUserId } = properties;

		return apiClient.request({
			path: `/sftp-users/${sftpUserId}`,
			method: 'DELETE',
		});
	});
