import { appResource } from '../resource';

export default appResource
	.addOperation({
		name: 'List Apps',
		action: 'List all available apps',
		description: 'Get a list of all available apps',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/apps`,
			method: 'GET',
		});
	});
