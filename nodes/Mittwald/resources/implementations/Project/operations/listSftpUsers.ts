import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'List SFTP Users',
		action: 'List all SFTP users',
		description: 'Get a list of all SFTP users in a project',
		paginated: true,
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient, pagination }) => {
		const { project } = properties;

		return apiClient.requestList({
			path: `/projects/${project}/sftp-users`,
			pagination,
		});
	});
