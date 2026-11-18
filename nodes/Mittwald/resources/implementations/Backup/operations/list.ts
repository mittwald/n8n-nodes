import projectProperty from '../../shared/projectProperty';
import { backupResource } from '../resource';

export default backupResource
	.addOperation({
		name: 'List',
		action: 'List project backups',
		description: 'Get a list of backups belonging to a project',
		paginated: true,
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient, pagination }) => {
		const { project } = properties;

		return apiClient.requestList({
			path: `/projects/${project}/backups`,
			pagination,
		});
	});
