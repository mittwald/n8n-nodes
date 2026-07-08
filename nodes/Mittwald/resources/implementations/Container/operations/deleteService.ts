import projectProperty from '../../shared/projectProperty';
import { containerResource } from '../resource';
import { resolveStackId } from './stackResolver';
import Z from 'zod';

export default containerResource
	.addOperation({
		name: 'Delete Service',
		action: 'Delete a service from a project',
		description:
			'Remove a service from a container project without replacing the rest of the project definition',
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
			description: 'Name of the service to delete. Maximum 63 characters.',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project, serviceName } = properties;
		const stackId = await resolveStackId(apiClient, project);

		return apiClient.request({
			path: `/stacks/${stackId}`,
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
