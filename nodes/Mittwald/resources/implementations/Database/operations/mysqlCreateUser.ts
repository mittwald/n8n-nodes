import { databaseResource } from '../resource';
import Z from 'zod';

export default databaseResource
	.addOperation({
		name: 'Create MySQL User',
		action: 'Create a MySQL user',
		description:
			'Create an additional user for an existing MySQL database. Unlike the user created together with the database, this one may be read-only.',
	})
	.withProperties({
		mysqlDatabaseId: {
			displayName: 'MySQL Database ID',
			description: 'The unique identifier of the MySQL database the user gets access to',
			type: 'string',
			required: true,
			default: '',
		},
		description: {
			displayName: 'Name',
			description: 'Description for the new MySQL user',
			type: 'string',
			required: true,
			default: '',
		},
		password: {
			displayName: 'Password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
			description: 'Password for the new MySQL user',
		},
		accessLevel: {
			displayName: 'Access Level',
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
			description: 'Whether the user may write to the database or only read from it',
		},
		externalAccess: {
			displayName: 'External Access',
			type: 'boolean',
			default: false,
			description: 'Whether the user may connect from outside the mittwald platform',
		},
		accessIpMask: {
			displayName: 'Access IP Mask',
			type: 'string',
			default: '',
			description:
				'IP range in CIDR notation the user may connect from, for example 203.0.113.0/24. Empty allows every address.',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { mysqlDatabaseId, description, password, accessLevel, externalAccess, accessIpMask } =
			properties;

		const mysqlUser = await apiClient.request({
			path: `/mysql-databases/${mysqlDatabaseId}/users`,
			method: 'POST',
			requestSchema: Z.object({
				databaseId: Z.string(),
				description: Z.string().min(1),
				password: Z.string().min(1),
				accessLevel: Z.enum(['full', 'readonly']),
				externalAccess: Z.boolean(),
				accessIpMask: Z.string().optional(),
			}),
			responseSchema: Z.object({
				id: Z.string(),
			}),
			body: {
				databaseId: mysqlDatabaseId,
				description,
				password,
				accessLevel,
				externalAccess,
				accessIpMask: accessIpMask || undefined,
			},
		});

		return apiClient.request({
			path: `/mysql-users/${mysqlUser.id}`,
			method: 'GET',
			polling: {
				waitUntil: {
					untilSuccess: true,
				},
			},
		});
	});
