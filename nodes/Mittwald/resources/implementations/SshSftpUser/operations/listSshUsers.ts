import projectProperty from '../../shared/projectProperty';
import { sshSftpUserResource } from '../resource';

export default sshSftpUserResource
	.addOperation({
		name: 'List SSH Users',
		action: 'List all SSH users',
		description: 'Get a list of all SSH users in a project',
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
			path: `/projects/${project}/ssh-users`,
			method: 'GET',
		});
	});
