import projectProperty from '../../shared/projectProperty';
import { containerResource } from '../resource';
import {
	buildServiceRequest,
	environmentProperty,
	updateStackWithServiceRequestSchema,
} from './serviceRequest';
import { resolveStackId } from './stackResolver';

export default containerResource
	.addOperation({
		name: 'Update Service',
		action: 'Update a service in a project',
		description: 'Update selected fields of a service in a container project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		serviceName: {
			displayName: 'Service Name',
			type: 'string',
			required: true,
			default: '',
			description: 'Name of the service to update. Maximum 63 characters.',
		},
		image: {
			displayName: 'Image',
			description: 'Container image to run, for example nginx:latest',
			type: 'string',
			required: false,
			default: '',
		},
		command: {
			displayName: 'Command',
			type: 'string',
			required: false,
			default: '',
			description: 'Comma-separated docker command values',
		},
		entrypoint: {
			displayName: 'Entrypoint',
			type: 'string',
			required: false,
			default: '',
			description: 'Comma-separated docker entrypoint values',
		},
		ports: {
			displayName: 'Ports',
			type: 'string',
			required: false,
			default: '',
			description: 'Comma-separated port mappings, for example 8080:80/tcp',
		},
		volumes: {
			displayName: 'Volumes',
			type: 'string',
			required: false,
			default: '',
			description: 'Comma-separated volume mounts, for example data:/var/www',
		},
		environment: environmentProperty,
		description: {
			displayName: 'Description',
			description: 'Human-readable description of the service',
			type: 'string',
			required: false,
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const {
			project,
			serviceName,
			image,
			command,
			entrypoint,
			ports,
			volumes,
			environment,
			description,
		} = properties;
		const stackId = await resolveStackId(apiClient, project);
		const serviceRequest = buildServiceRequest({
			image,
			command,
			entrypoint,
			ports,
			volumes,
			environment,
			description,
		});

		return apiClient.request({
			path: `/stacks/${stackId}`,
			method: 'PATCH',
			requestSchema: updateStackWithServiceRequestSchema,
			body: {
				services: {
					[serviceName]: serviceRequest,
				},
			},
		});
	});
