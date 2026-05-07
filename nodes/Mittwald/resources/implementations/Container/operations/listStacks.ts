import projectProperty from '../../shared/projectProperty';
import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'List Stacks',
		action: 'List stacks in a project',
		description: 'Get a list of stacks belonging to a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/stacks`,
			method: 'GET',
		});
	});
