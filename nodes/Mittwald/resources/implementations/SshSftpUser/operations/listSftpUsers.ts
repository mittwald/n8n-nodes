import projectProperty from '../../shared/projectProperty';
import { sshSftpUserResource } from '../resource';

export default sshSftpUserResource
	.addOperation({
		name: 'List SFTP Users',
		action: 'List all SFTP users',
		description: 'Get a list of all SFTP users in a project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/sftp-users`,
			method: 'GET',
		});
	});
