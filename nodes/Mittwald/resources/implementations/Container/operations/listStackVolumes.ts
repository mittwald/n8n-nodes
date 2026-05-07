import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'List Stack Volumes',
		action: 'List volumes belonging to a stack',
		description: 'Get a list of volumes belonging to a stack',
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
			path: `/stacks/${stackId}/volumes`,
			method: 'GET',
		});
	});
