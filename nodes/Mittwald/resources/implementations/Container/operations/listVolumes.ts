import projectProperty from '../../shared/projectProperty';
import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'List Volumes',
		action: 'List volumes in a project',
		description: 'Get a list of volumes belonging to a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/volumes`,
			method: 'GET',
		});
	});
