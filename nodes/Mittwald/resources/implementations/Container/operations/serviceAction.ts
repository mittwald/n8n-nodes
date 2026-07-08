import projectProperty from '../../shared/projectProperty';
import { containerResource } from '../resource';
import { resolveStackId } from './stackResolver';

export default containerResource
	.addOperation({
		name: 'Service Action',
		action: 'Run an action on a service',
		description: 'Start, stop, restart, recreate, or pull the image for a service',
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
		const { project, serviceId, action } = properties;
		const stackId = await resolveStackId(apiClient, project);

		return apiClient.request({
			path: `/stacks/${stackId}/services/${serviceId}/actions/${action}`,
			method: 'POST',
		});
	});
