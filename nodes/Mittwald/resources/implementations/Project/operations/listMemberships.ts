import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'List memberships',
		action: 'List all memberships',
		description: 'Get a list of all project memberships',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async (context) => {
		const { project } = context.properties;

		return context.apiClient.request({
			path: `/projects/${project}/memberships`,
			method: 'GET',
		});
	});
