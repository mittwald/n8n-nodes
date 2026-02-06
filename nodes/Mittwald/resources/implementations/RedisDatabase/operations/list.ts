import projectProperty from '../../shared/projectProperty';
import { redisDatabaseResource } from '../resource';

export default redisDatabaseResource
	.addOperation({
		name: 'List All',
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
