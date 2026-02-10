import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'list',
		action: 'List all projects',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/projects`,
			method: 'GET',
		});
	});
