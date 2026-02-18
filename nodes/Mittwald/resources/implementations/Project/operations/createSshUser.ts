import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';
import Z from 'zod';

export default projectResource
	.addOperation({
		name: 'Create SSH User',
		action: 'Create an SSH user',
		description: 'Create an SSH user for a project',
	})
	.withProperties({
		project: projectProperty,
		description: {
			displayName: 'Name',
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
			description: 'Password used for authentication',
		},
		expiresAt: {
			displayName: 'Expires At',
			type: 'dateTime',
			required: false,
			default: '',
			description: 'Optional expiration date for the SSH user',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project, description, password, expiresAt } = properties;

		return apiClient.request({
			path: `/projects/${project}/ssh-users`,
			method: 'POST',
			requestSchema: Z.object({
				description: Z.string().min(1),
				authentication: Z.object({
					password: Z.string().min(1),
				}),
				expiresAt: Z.string().optional(),
			}),
			responseSchema: Z.object({
				id: Z.string(),
				projectId: Z.string(),
				description: Z.string(),
				userName: Z.string(),
				createdAt: Z.string(),
				authUpdatedAt: Z.string(),
				hasPassword: Z.boolean(),
			}),
			body: {
				description,
				authentication: {
					password,
				},
				expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
			},
		});
	});
