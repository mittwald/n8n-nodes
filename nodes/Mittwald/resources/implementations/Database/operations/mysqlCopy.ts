import { databaseResource } from '../resource';
import Z from 'zod';

export default databaseResource
	.addOperation({
		name: 'Copy MySQL Database',
		action: 'Copy a MySQL database',
		description: 'Copy a MySQL database into a new database with its own user',
	})
	.withProperties({
		mysqlDatabaseId: {
			displayName: 'MySQL Database ID',
			type: 'string',
			required: true,
			default: '',
			description: 'ID of the MySQL database to copy',
		},
		description: {
			displayName: 'Name',
			type: 'string',
			required: true,
			default: '',
			description: 'Name for the new MySQL database',
		},
		userPassword: {
			displayName: 'User Password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
			description: 'Password for the user of the copied database',
		},
		userExternalAccess: {
			displayName: 'User External Access',
			type: 'boolean',
			default: false,
			description: 'Whether to allow external access for the user of the copied database',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { mysqlDatabaseId, description, userPassword, userExternalAccess } = properties;

		const copy = await apiClient.request({
			path: `/mysql-databases/${mysqlDatabaseId}/actions/copy`,
			method: 'POST',
			requestSchema: Z.object({
				description: Z.string().min(1),
				user: Z.object({
					password: Z.string().min(1),
					accessLevel: Z.literal('full'),
					externalAccess: Z.boolean(),
				}),
			}),
			responseSchema: Z.object({
				id: Z.string(),
				userId: Z.string(),
			}),
			body: {
				description,
				user: {
					password: userPassword,
					accessLevel: 'full',
					externalAccess: userExternalAccess,
				},
			},
		});

		return apiClient.request({
			path: `/mysql-databases/${copy.id}`,
			method: 'GET',
			polling: {
				waitUntil: {
					untilSuccess: true,
				},
			},
		});
	});
