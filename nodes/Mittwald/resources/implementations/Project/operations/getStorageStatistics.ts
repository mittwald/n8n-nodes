import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Get Storage Statistics',
		action: 'Get storage statistics',
		description: 'Get storage usage statistics for a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/storage-space-statistics`,
			method: 'GET',
		});
	});
