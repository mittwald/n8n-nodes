import stackProperty from '../../shared/stackProperty';
import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'Service Action',
		action: 'Run an action on a service',
		description: 'Start, stop, restart, recreate, or pull the image for a service',
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
		action: {
			displayName: 'Action',
			type: 'options',
			required: true,
			default: 'start',
			options: [
				{
					name: 'Start',
					value: 'start',
				},
				{
					name: 'Stop',
					value: 'stop',
				},
				{
					name: 'Restart',
					value: 'restart',
				},
				{
					name: 'Recreate',
					value: 'recreate',
				},
				{
					name: 'Pull Image',
					value: 'pull',
				},
			],
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { stack, serviceId, action } = properties;

		return apiClient.request({
			path: `/stacks/${stack}/services/${serviceId}/actions/${action}`,
			method: 'POST',
		});
	});
