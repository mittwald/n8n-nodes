import projectProperty from '../../shared/projectProperty';
import { databaseResource } from '../resource';

export default databaseResource
	.addOperation({
		name: 'redis-list',
		action: 'List all Redis databases',
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
