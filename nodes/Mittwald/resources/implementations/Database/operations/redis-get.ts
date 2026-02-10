import { databaseResource } from '../resource';

export default databaseResource
	.addOperation({
		name: 'redis-get',
		action: 'Get a Redis database',
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
