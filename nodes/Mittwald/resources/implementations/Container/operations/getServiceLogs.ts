import projectProperty from '../../shared/projectProperty';
import { containerResource } from '../resource';
import { resolveStackId } from './stackResolver';

export default containerResource
	.addOperation({
		name: 'Get Service Logs',
		action: 'Get logs of a service',
		description: 'Get log output from a service in a container project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		serviceId: {
			displayName: 'Service ID',
			type: 'string',
			required: true,
			default: '',
		},
		tail: {
			displayName: 'Tail',
			type: 'number',
			required: false,
			default: 0,
			description: 'Number of lines from the end of the logs to return (0 = all)',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project, serviceId, tail } = properties;
		const stackId = await resolveStackId(apiClient, project);

		return apiClient.request<string>({
			path: `/stacks/${stackId}/services/${serviceId}/logs`,
			method: 'GET',
			qs: tail > 0 ? { tail } : undefined,
			returnFullResponse: true,
		});
	});
