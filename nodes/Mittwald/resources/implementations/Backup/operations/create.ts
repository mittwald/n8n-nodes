import projectProperty from '../../shared/projectProperty';
import { backupResource } from '../resource';
import Z from 'zod';

export default backupResource
	.addOperation({
		name: 'Create',
		action: 'Create a project backup',
		description: 'Create a manual backup of a project',
	})
	.withProperties({
		project: projectProperty,
		description: {
			displayName: 'Description',
			type: 'string',
			default: '',
		},
		expirationTime: {
			displayName: 'Expiration Time',
			type: 'dateTime',
			required: true,
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project, description, expirationTime } = properties;

		return apiClient.request({
			path: `/projects/${project}/backups`,
			method: 'POST',
			requestSchema: Z.object({
				description: Z.string().optional(),
				expirationTime: Z.string(),
			}),
			body: {
				description,
				expirationTime: new Date(expirationTime).toISOString(),
			},
		});
	});
