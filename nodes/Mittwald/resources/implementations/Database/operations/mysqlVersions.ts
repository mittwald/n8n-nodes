import { databaseResource } from '../resource';

export default databaseResource
	.addOperation({
		name: 'List MySQL Versions',
		action: 'List MySQL versions',
		description: 'Get a list of available MySQL versions',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/mysql-versions`,
			method: 'GET',
		});
	});
