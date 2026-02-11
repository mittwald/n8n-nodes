import { projectResource } from '../resource';
import projectProperty from '../../shared/projectProperty';

export default projectResource
	.addOperation({
		name: 'Delete',
		action: 'Delete a project',
		description: 'Delete an existing project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project } = properties;

		return await apiClient.request({
			path: `/projects/${project}`,
			method: 'DELETE',
		});
	});
