import projectProperty from '../../shared/projectProperty';
import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'List Registries',
		action: 'List container registries in a project',
		description: 'Get a list of container registries belonging to a project',
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
			path: `/projects/${project}/registries`,
			method: 'GET',
		});
	});
