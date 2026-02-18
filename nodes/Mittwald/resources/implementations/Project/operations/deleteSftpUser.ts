import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Delete SFTP User',
		action: 'Delete an SFTP user',
		description: 'Delete an SFTP user by ID',
	})
	.withProperties({
		sftpUserId: {
			displayName: 'SFTP User ID',
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
