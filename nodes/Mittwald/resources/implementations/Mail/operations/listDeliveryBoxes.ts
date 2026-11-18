import projectProperty from '../../shared/projectProperty';
import { mailResource } from '../resource';

export default mailResource
	.addOperation({
		name: 'List Delivery Boxes',
		action: 'List delivery boxes for a project',
		description: 'Get a list of delivery boxes in a project',
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
			path: `/projects/${project}/delivery-boxes`,
			pagination,
		});
	});
