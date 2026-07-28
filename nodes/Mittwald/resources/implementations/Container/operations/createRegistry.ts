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
			description: 'Hostname of the container registry, for example ghcr.io',
			type: 'string',
			required: true,
			default: '',
		},
		registryDescription: {
			displayName: 'Name',
			description: 'Human-readable name of the registry',
			type: 'string',
			required: true,
			default: '',
		},
		username: {
			displayName: 'Username',
			description: 'Username for the registry; leave empty for an anonymous registry',
			type: 'string',
			required: false,
			default: '',
		},
		password: {
			displayName: 'Password',
			description: 'Password for the registry; leave empty for an anonymous registry',
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
				credentials: Z.object({
					username: Z.string().min(1),
					password: Z.string().min(1),
				}).optional(),
			}),
			body: {
				uri,
				description: registryDescription,
				credentials,
			},
		});
	});
