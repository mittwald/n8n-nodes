import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'List Ingresses',
		action: 'List ingresses',
		description: 'Get a list of all ingresses',
		paginated: true,
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.requestList({
			path: `/ingresses`,
			pagination: context.pagination,
		});
	});
