import { domainResource } from '../resource';
import projectProperty from '../../shared/projectProperty';

export default domainResource
	.addOperation({
		name: 'List DNS Zones',
		action: 'List DNS zones in a project',
		description: 'Get a list of DNS zones in a project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/dns-zones`,
			method: 'GET',
		});
	});
