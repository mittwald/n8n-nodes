import { redisDatabaseResource } from '../resource';
import { RedisDatabaseSchema } from '../schemas';

export default redisDatabaseResource
	.addOperation({
		name: 'Get',
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
			responseSchema: RedisDatabaseSchema,
		});
	});
