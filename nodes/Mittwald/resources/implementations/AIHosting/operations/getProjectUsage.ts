import projectProperty from '../../shared/projectProperty';
import { aiHostingResource } from '../resource';

export default aiHostingResource
	.addOperation({
		name: 'Get Project Usage',
		action: 'Get AI hosting usage for a project',
		description: 'Get the AI hosting plan and usage details of a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/ai-hosting`,
			method: 'GET',
		});
	});
