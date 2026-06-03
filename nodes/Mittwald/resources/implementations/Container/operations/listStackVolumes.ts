import stackProperty from '../../shared/stackProperty';
import { containerResource } from '../resource';

export default containerResource
	.addOperation({
		name: 'List Stack Volumes',
		action: 'List volumes belonging to a stack',
		description: 'Get a list of volumes belonging to a stack',
	})
	.withProperties({
		stack: {
			...stackProperty,
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { stack } = properties;

		return apiClient.request({
			path: `/stacks/${stack}/volumes`,
			method: 'GET',
		});
	});
