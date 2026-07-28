import projectProperty from '../../shared/projectProperty';
import registryProperty from '../../shared/registryProperty';
import { containerResource } from '../resource';
import Z from 'zod';

interface UpdateRegistryRequest {
	uri: string | undefined;
	description: string | undefined;
	credentials:
		| {
				username: string;
				password: string;
		  }
		| undefined;
}

export default containerResource
	.addOperation({
		name: 'Update Registry',
		action: 'Update a container registry',
		description: 'Update selected fields of a container registry',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		registry: {
			...registryProperty,
			required: true,
		},
		uri: {
			displayName: 'Hostname / URI',
			description: 'Hostname of the container registry, for example ghcr.io',
			type: 'string',
			required: false,
			default: '',
		},
		registryDescription: {
			displayName: 'Name',
			description: 'Human-readable name of the registry',
			type: 'string',
			required: false,
			default: '',
		},
		username: {
			displayName: 'Username',
			description: 'Username for the registry; leave both credential fields empty to keep the current credentials',
			type: 'string',
			required: false,
			default: '',
		},
		password: {
			displayName: 'Password',
			description: 'Password for the registry; leave both credential fields empty to keep the current credentials',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: false,
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { registry, uri, registryDescription, username, password } = properties;
		const body: UpdateRegistryRequest = {
			uri: uri || undefined,
			description: registryDescription || undefined,
			credentials:
				username && password
					? {
							username,
							password,
						}
					: undefined,
		};

		return apiClient.request({
			path: `/registries/${registry}`,
			method: 'PATCH',
			requestSchema: Z.object({
				uri: Z.string().min(1).optional(),
				description: Z.string().min(1).optional(),
				credentials: Z.object({
					username: Z.string().min(1),
					password: Z.string().min(1),
				}).optional(),
			}),
			body,
		});
	});
