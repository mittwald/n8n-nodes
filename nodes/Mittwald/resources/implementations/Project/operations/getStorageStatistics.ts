import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Get Storage Statistics',
		action: 'Get project storage statistics',
		description: 'Get storage usage statistics for a project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/storage-space-statistics`,
			method: 'GET',
		});
	});
