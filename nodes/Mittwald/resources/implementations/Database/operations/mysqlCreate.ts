import { databaseResource } from '../resource';
import projectProperty from '../../shared/projectProperty';
import mysqlVersionProperty from '../../shared/mysqlVersionProperty';
import Z from 'zod';

export default databaseResource
	.addOperation({
		name: 'Create MySQL Database',
		action: 'Create a MySQL database',
		description: 'Create a new MySQL database with an initial user in a project',
	})
	.withProperties({
		project: projectProperty,
		description: {
			displayName: 'Name',
			description: 'Description for the new MySQL database',
			type: 'string',
			required: true,
			default: '',
		},
		version: mysqlVersionProperty,
		characterSet: {
			displayName: 'Character Set',
			type: 'string',
			default: 'utf8mb4',
			description: 'Character set used for the database',
		},
		collation: {
			displayName: 'Collation',
			type: 'string',
			default: 'utf8mb4_unicode_ci',
			description: 'Collation used for the database',
		},
		userPassword: {
			displayName: 'User Password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
			description: 'Password for the initial MySQL user',
		},
		userExternalAccess: {
			displayName: 'User External Access',
			type: 'boolean',
			default: false,
			description: 'Whether to allow external access for the initial user',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const {
			project,
			description,
			version,
			characterSet,
			collation,
			userPassword,
			userExternalAccess,
		} = properties;

		const mysqlDatabase = await apiClient.request({
			path: `/projects/${project}/mysql-databases`,
			method: 'POST',
			requestSchema: Z.object({
				database: Z.object({
					description: Z.string().min(1),
					version: Z.string(),
					characterSettings: Z.object({
						characterSet: Z.string(),
						collation: Z.string(),
					}),
				}),
				user: Z.object({
					password: Z.string().min(1),
					// The API only accepts `full` for the user created together with the
					// database; a read-only user has to be added to the database afterwards.
					accessLevel: Z.literal('full'),
					externalAccess: Z.boolean(),
				}),
			}),
			responseSchema: Z.object({
				id: Z.string().uuid(),
			}),
			body: {
				database: {
					description,
					version,
					characterSettings: {
						characterSet,
						collation,
					},
				},
				user: {
					password: userPassword,
					accessLevel: 'full',
					externalAccess: userExternalAccess,
				},
			},
		});

		return apiClient.request({
			path: `/mysql-databases/${mysqlDatabase.id}`,
			method: 'GET',
			polling: {
				waitUntil: {
					untilSuccess: true,
				},
			},
		});
	});
