import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'Get Stack',
		action: 'Get a stack',
		description: 'Get details of a specific stack',
	})
	.withProperties({
		stackId: {
			displayName: 'Stack ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { stackId } = properties;

		return apiClient.request({
			path: `/stacks/${stackId}`,
			method: 'GET',
		});
	});
