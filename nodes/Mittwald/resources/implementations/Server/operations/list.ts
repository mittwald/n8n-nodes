import { serverResource } from '../resource';

export default serverResource
	.addOperation({
		name: 'List',
		action: 'List all servers',
		description: 'Get a list of all servers',
		paginated: true,
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.requestList({
			path: `/servers`,
			pagination: context.pagination,
		});
	});
