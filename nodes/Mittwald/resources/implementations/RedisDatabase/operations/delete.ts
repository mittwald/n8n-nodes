import { redisDatabaseResource } from '../resource';
import redisDatabaseProperty from '../../shared/redisDatabaseProperty';

export default redisDatabaseResource
	.addOperation({
		name: 'Remove',
		action: 'Delete Redis Database',
	})
	.withProperties({
		redisDatabase: redisDatabaseProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { redisDatabase } = properties;

		return await apiClient.request({
			path: `/redis-databases/${redisDatabase}`,
			method: 'DELETE',
		});
	});
