import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'List',
		action: 'List domains',
		description: 'Get a list of all domains',
		paginated: true,
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.requestList({
			path: `/domains`,
			pagination: context.pagination,
		});
	});
