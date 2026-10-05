import { sshSftpUserResource } from '../resource';

export default sshSftpUserResource
	.addOperation({
		name: 'Get SFTP User',
		action: 'Get an SFTP user',
		description: 'Get details of a specific SFTP user',
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
			method: 'GET',
		});
	});
