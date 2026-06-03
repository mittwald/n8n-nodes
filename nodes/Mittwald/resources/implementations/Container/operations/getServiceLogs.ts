import stackProperty from '../../shared/stackProperty';
import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'Get Service Logs',
		action: 'Get logs of a service',
		description: 'Get log output from a service in a container stack',
	})
	.withProperties({
		stack: {
			...stackProperty,
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
		const { stack, serviceId, tail } = properties;

		return apiClient.request<string>({
			path: `/stacks/${stack}/services/${serviceId}/logs`,
			method: 'GET',
			qs: tail > 0 ? { tail } : undefined,
			returnFullResponse: true,
		});
	});
