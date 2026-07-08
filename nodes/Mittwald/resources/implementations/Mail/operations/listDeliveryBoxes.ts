import projectProperty from '../../shared/projectProperty';
import { mailResource } from '../resource';

export default mailResource
	.addOperation({
		name: 'List Delivery Boxes',
		action: 'List delivery boxes for a project',
		description: 'Get a list of delivery boxes in a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/delivery-boxes`,
			method: 'GET',
		});
	});
