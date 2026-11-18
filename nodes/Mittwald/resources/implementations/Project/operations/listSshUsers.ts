import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'List SSH Users',
		action: 'List all SSH users',
		description: 'Get a list of all SSH users in a project',
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
			path: `/projects/${project}/ssh-users`,
			pagination,
		});
	});
