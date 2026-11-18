import projectProperty from '../../shared/projectProperty';
import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'List Volumes',
		action: 'List volumes in a project',
		description: 'Get a list of volumes belonging to a project',
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
			path: `/projects/${project}/volumes`,
			pagination,
		});
	});
