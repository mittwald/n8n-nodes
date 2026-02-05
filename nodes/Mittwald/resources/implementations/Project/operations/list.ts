import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'List All',
		action: 'List all Projects',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/projects`,
			method: 'GET',
		});
	});
