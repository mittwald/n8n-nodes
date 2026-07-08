import { databaseResource } from '../resource';

export default databaseResource
	.addOperation({
		name: 'Delete MySQL Database',
		action: 'Delete a MySQL database',
		description: 'Delete an existing MySQL database',
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
			method: 'DELETE',
		});
	});
