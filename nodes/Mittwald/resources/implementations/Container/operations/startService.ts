import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'Start Service',
		action: 'Start a stopped service',
		description: 'Start a stopped service in a stack',
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
			path: `/stacks/${stackId}/services/${serviceId}/actions/start`,
			method: 'POST',
		});
	});
