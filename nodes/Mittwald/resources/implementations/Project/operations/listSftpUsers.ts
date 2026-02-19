import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'List SFTP Users',
		action: 'List all SFTP users',
		description: 'Get a list of all SFTP users in a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/sftp-users`,
			method: 'GET',
		});
	});
