import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'List',
		action: 'List all projects',
		description: 'Get a list of all projects',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/projects`,
			method: 'GET',
		});
	});
