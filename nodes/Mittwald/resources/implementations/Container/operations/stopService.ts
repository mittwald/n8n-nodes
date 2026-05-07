import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'Stop Service',
		action: 'Stop a started service',
		description: 'Stop a started service in a stack',
	})
	.withProperties({
		stackId: {
			displayName: 'Stack ID',
			type: 'string',
			default: '',
		},
		serviceId: {
			displayName: 'Service ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { stackId, serviceId } = properties;

		return apiClient.request({
			path: `/stacks/${stackId}/services/${serviceId}/actions/stop`,
			method: 'POST',
		});
	});
