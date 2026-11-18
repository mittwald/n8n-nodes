import { appResource } from '../resource';

export default appResource
	.addOperation({
		name: 'List Apps',
		action: 'List all available apps',
		description: 'Get a list of all available apps',
		paginated: true,
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.requestList({
			path: `/apps`,
			pagination: context.pagination,
		});
	});
