import projectProperty from '../../shared/projectProperty';
import { databaseResource } from '../resource';

export default databaseResource
	.addOperation({
		name: 'List MySQL Databases',
		action: 'List all MySQL databases',
		description: 'Get a list of all MySQL databases in a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/mysql-databases`,
			method: 'GET',
		});
	});
