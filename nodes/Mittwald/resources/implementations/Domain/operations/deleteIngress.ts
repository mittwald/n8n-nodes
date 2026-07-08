import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'Delete Ingress',
		action: 'Delete an ingress',
		description: 'Delete an ingress',
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
			method: 'DELETE',
		});
	});
