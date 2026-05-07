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
			displayName: 'Source MySQL Database ID',
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
			description: 'Description for the new MySQL database',
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
		userAccessLevel: {
			displayName: 'User Access Level',
			type: 'options',
			default: 'full',
			options: [
				{
					name: 'Full',
					value: 'full',
				},
				{
					name: 'Read-Only',
					value: 'readonly',
				},
			],
		},
		userExternalAccess: {
			displayName: 'User External Access',
			type: 'boolean',
			default: false,
			description: 'Whether to allow external access for the user of the copied database',
		},
		userDescription: {
			displayName: 'User Description',
			type: 'string',
			default: '',
			description: 'Optional description for the user of the copied database',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const {
			mysqlDatabaseId,
			description,
			userPassword,
			userAccessLevel,
			userExternalAccess,
			userDescription,
		} = properties;

		const copy = await apiClient.request({
			path: `/mysql-databases/${mysqlDatabaseId}/actions/copy`,
			method: 'POST',
			requestSchema: Z.object({
				database: Z.object({
					description: Z.string().min(1),
				}),
				user: Z.object({
					password: Z.string().min(1),
					accessLevel: Z.enum(['full', 'readonly']),
					externalAccess: Z.boolean(),
					description: Z.string().optional(),
				}),
			}),
			responseSchema: Z.object({
				id: Z.string().uuid(),
			}),
			body: {
				database: {
					description,
				},
				user: {
					password: userPassword,
					accessLevel: userAccessLevel,
					externalAccess: userExternalAccess,
					description: userDescription || undefined,
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
