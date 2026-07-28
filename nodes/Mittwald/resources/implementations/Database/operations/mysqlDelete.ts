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
			description: 'The unique identifier of the MySQL database',
			type: 'string',
			default: '',
			required: true,
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
