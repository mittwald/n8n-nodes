import stackProperty from '../../shared/stackProperty';
import { containerResource } from '../resource';
import Z from 'zod';

export default containerResource
	.addOperation({
		name: 'Delete Service',
		action: 'Delete a service from a stack',
		description:
			'Remove a service from a container stack without replacing the rest of the stack definition',
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
			description: 'Name of the service to delete. Maximum 63 characters.',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { stack, serviceName } = properties;

		return apiClient.request({
			path: `/stacks/${stack}`,
			method: 'PATCH',
			requestSchema: Z.object({
				services: Z.record(Z.string().min(1).max(63), Z.object({})),
			}),
			body: {
				services: {
					[serviceName]: {},
				},
			},
		});
	});
