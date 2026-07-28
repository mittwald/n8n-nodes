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
		project: {
			...projectProperty,
			required: true,
		},
		description: {
			displayName: 'Name',
			description: 'Name of the SFTP user as shown in the mittwald backend',
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
			description: 'Whether the user may only read or also write in the selected directories',
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
		allDirectories: {
			displayName: 'Access to All Directories',
			type: 'boolean',
			required: false,
			default: false,
			description:
				'Whether the user may access every directory of the project. Turn this off to name the directories individually.',
		},
		directories: {
			displayName: 'Directories',
			type: 'string',
			required: true,
			default: '',
			description: 'One or more directories, separated by commas or new lines',
			displayOptions: {
				show: {
					allDirectories: [false],
				},
			},
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
		const { project, description, password, accessLevel, allDirectories, directories, expiresAt } =
			properties;
		// The project root is what mStudio stores for "access to all directories".
		const parsedDirectories = allDirectories
			? ['/']
			: directories
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
