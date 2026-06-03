import stackProperty from '../../shared/stackProperty';
import { containerResource } from '../resource';
import {
	buildServiceRequest,
	createStackWithServiceRequestSchema,
	environmentProperty,
} from './serviceRequest';

export default containerResource
	.addOperation({
		name: 'Create Service',
		action: 'Create a service in a stack',
		description: 'Create a service in a container stack',
	})
	.withProperties({
		stack: {
			...stackProperty,
			required: true,
		},
		serviceName: {
			displayName: 'Service Name',
			type: 'string',
			required: true,
			default: '',
			description: 'Name of the service to create. Maximum 63 characters.',
		},
		image: {
			displayName: 'Image',
			type: 'string',
			required: true,
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
			type: 'string',
			required: false,
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const {
			stack,
			serviceName,
			image,
			command,
			entrypoint,
			ports,
			volumes,
			environment,
			description,
		} = properties;
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
			path: `/stacks/${stack}`,
			method: 'PATCH',
			requestSchema: createStackWithServiceRequestSchema,
			body: {
				services: {
					[serviceName]: serviceRequest,
				},
			},
		});
	});
