import projectProperty from '../../shared/projectProperty';
import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'List Services',
		action: 'List services in a project',
		description: 'Get a list of services belonging to a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/services`,
			method: 'GET',
		});
	});
