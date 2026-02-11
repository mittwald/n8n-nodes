import projectProperty from '../../shared/projectProperty';
import { databaseResource } from '../resource';

export default databaseResource
	.addOperation({
		name: 'List Redis Databases',
		action: 'List all Redis databases',
		description: 'Get a list of all Redis databases in a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/redis-databases`,
			method: 'GET',
		});
	});
