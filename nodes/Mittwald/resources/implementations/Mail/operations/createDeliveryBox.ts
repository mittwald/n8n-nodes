import projectProperty from '../../shared/projectProperty';
import { mailResource } from '../resource';
import Z from 'zod';

export default mailResource
	.addOperation({
		name: 'Create Delivery Box',
		action: 'Create a delivery box',
		description: 'Create a new delivery box in a project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		description: {
			displayName: 'Name',
			type: 'string',
			required: true,
			default: '',
			description: 'Human-readable name of the delivery box',
		},
		password: {
			displayName: 'Password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
			description: 'Password used to authenticate against the delivery box',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project, description, password } = properties;

		return apiClient.request({
			path: `/projects/${project}/delivery-boxes`,
			method: 'POST',
			requestSchema: Z.object({
				description: Z.string().min(1),
				password: Z.string().min(1),
			}),
			body: {
				description,
				password,
			},
		});
	});
