import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'List Invites',
		action: 'List all invites',
		description: 'Get a list of all project invitations',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async (context) => {
		const { project } = context.properties;

		return context.apiClient.request({
			path: `/projects/${project}/invites`,
			method: 'GET',
		});
	});
