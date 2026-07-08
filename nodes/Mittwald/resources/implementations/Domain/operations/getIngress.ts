import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'Get Ingress',
		action: 'Get an ingress',
		description: 'Get details of a specific ingress',
	})
	.withProperties({
		ingressId: {
			displayName: 'Ingress ID',
			type: 'string',
			default: '',
			required: true,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { ingressId } = properties;

		return apiClient.request({
			path: `/ingresses/${ingressId}`,
			method: 'GET',
		});
	});
