import { databaseResource } from '../resource';

export default databaseResource
	.addOperation({
		name: 'List Redis Versions',
		action: 'List Redis versions',
		description: 'Get a list of available Redis versions',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/redis-versions`,
			method: 'GET',
		});
	});
