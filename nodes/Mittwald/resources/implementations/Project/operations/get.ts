import { projectResource } from '../resource';
import projectProperty from '../../shared/projectProperty';

export default projectResource
	.addOperation({
		name: 'get',
		action: 'Get a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}`,
			method: 'GET',
		});
	});
