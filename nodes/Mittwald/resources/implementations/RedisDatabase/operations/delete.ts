import { redisDatabaseResource } from '../resource';

export default redisDatabaseResource
	.addOperation({
		name: 'Remove',
		action: 'Delete Redis database',
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
			method: 'DELETE',
			// DELETE returns no response body (204 No Content)
		});
	});
