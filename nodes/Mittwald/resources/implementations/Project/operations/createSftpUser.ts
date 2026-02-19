import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';
import Z from 'zod';

export default projectResource
	.addOperation({
		name: 'Create SFTP User',
		action: 'Create an SFTP user',
		description: 'Create an SFTP user for a project',
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
		accessLevel: {
			displayName: 'Access Level',
			type: 'options',
			required: true,
			default: 'read',
			options: [
				{
					name: 'Read',
					value: 'read',
				},
				{
					name: 'Full',
					value: 'full',
				},
			],
		},
		directories: {
			displayName: 'Directories',
			type: 'string',
			required: true,
			default: '',
			description: 'One or more directories, separated by commas or new lines',
		},
		expiresAt: {
			displayName: 'Expires At',
			type: 'dateTime',
			required: false,
			default: '',
			description: 'Optional expiration date for the SFTP user',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project, description, password, accessLevel, directories, expiresAt } = properties;
		const parsedDirectories = directories
			.split(/\n|,/)
			.map((directory) => directory.trim())
			.filter((directory) => directory.length > 0);

		if (parsedDirectories.length === 0) {
			throw new Error('At least one directory is required');
		}

		return apiClient.request({
			path: `/projects/${project}/sftp-users`,
			method: 'POST',
			requestSchema: Z.object({
				description: Z.string().min(1),
				accessLevel: Z.enum(['full', 'read']).optional(),
				authentication: Z.object({
					password: Z.string().min(1),
				}),
				directories: Z.array(Z.string()).min(1),
				expiresAt: Z.string().optional(),
			}),
			responseSchema: Z.object({
				id: Z.string(),
				projectId: Z.string(),
				description: Z.string(),
				userName: Z.string(),
				createdAt: Z.string(),
				authUpdatedAt: Z.string(),
				accessLevel: Z.string(),
				hasPassword: Z.boolean(),
			}),
			body: {
				description,
				accessLevel,
				authentication: {
					password,
				},
				directories: parsedDirectories,
				expiresAt: expiresAt ? expiresAt : undefined,
			},
		});
	});
