import projectProperty from '../../shared/projectProperty';
import { containerResource } from '../resource';
import Z from 'zod';

export default containerResource
	.addOperation({
		name: 'Create Registry',
		action: 'Create a container registry',
		description: 'Create a container registry for a project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		uri: {
			displayName: 'Hostname / URI',
			type: 'string',
			required: true,
			default: '',
		},
		registryDescription: {
			displayName: 'Description',
			type: 'string',
			required: true,
			default: '',
		},
		username: {
			displayName: 'Username',
			type: 'string',
			required: false,
			default: '',
		},
		password: {
			displayName: 'Password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: false,
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project, uri, registryDescription, username, password } = properties;
		const credentials =
			username && password
				? {
						username,
						password,
					}
				: undefined;

		return apiClient.request({
			path: `/projects/${project}/registries`,
			method: 'POST',
			requestSchema: Z.object({
				uri: Z.string().min(1),
				description: Z.string().min(1),
				credentials: Z
					.object({
						username: Z.string().min(1),
						password: Z.string().min(1),
					})
					.optional(),
			}),
			body: {
				uri,
				description: registryDescription,
				credentials,
			},
		});
	});
