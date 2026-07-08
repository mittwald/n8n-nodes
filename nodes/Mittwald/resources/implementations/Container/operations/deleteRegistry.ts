import projectProperty from '../../shared/projectProperty';
import registryProperty from '../../shared/registryProperty';
import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'Delete Registry',
		action: 'Delete a container registry',
		description: 'Delete a container registry',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		registry: {
			...registryProperty,
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { registry } = properties;

		return apiClient.request({
			path: `/registries/${registry}`,
			method: 'DELETE',
		});
	});
