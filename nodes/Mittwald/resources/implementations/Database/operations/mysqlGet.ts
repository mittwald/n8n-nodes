import { databaseResource } from '../resource';

export default databaseResource
	.addOperation({
		name: 'Get MySQL Database',
		action: 'Get a MySQL database',
		description: 'Get details of a specific MySQL database',
	})
	.withProperties({
		mysqlDatabaseId: {
			displayName: 'MySQL Database ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { mysqlDatabaseId } = properties;

		return apiClient.request({
			path: `/mysql-databases/${mysqlDatabaseId}`,
			method: 'GET',
		});
	});
