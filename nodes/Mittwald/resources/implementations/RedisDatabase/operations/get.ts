import { redisDatabaseResource } from '../resource';

export default redisDatabaseResource
	.addOperation({
		name: 'Get',
		action: 'Get a Redis Database',
	})
	.withProperties({
		redisDatabaseId: {
			displayName: 'Redis Database ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { redisDatabaseId } = properties;

		return apiClient.request({
			path: `/redis-databases/${redisDatabaseId}`,
			method: 'GET',
		});
	});
