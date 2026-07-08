import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'List Ingresses',
		action: 'List ingresses',
		description: 'Get a list of all ingresses',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/ingresses`,
			method: 'GET',
		});
	});
