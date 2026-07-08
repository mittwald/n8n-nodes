import projectProperty from '../../shared/projectProperty';
import { backupResource } from '../resource';

export default backupResource
	.addOperation({
		name: 'List',
		action: 'List project backups',
		description: 'Get a list of backups belonging to a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/backups`,
			method: 'GET',
		});
	});
