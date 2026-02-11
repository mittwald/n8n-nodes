import { databaseResource } from '../resource';

export default databaseResource
	.addOperation({
		name: 'Delete Redis Database',
		action: 'Delete Redis database',
		description: 'Delete an existing Redis database',
	})
	.withProperties({
		redisDatabaseId: {
			displayName: 'Redis database ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { redisDatabaseId } = properties;

		return apiClient.request({
			path: `/redis-databases/${redisDatabaseId}`,
			method: 'DELETE',
		});
	});
