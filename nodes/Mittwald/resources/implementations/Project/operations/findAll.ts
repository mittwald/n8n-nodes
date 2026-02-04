import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Find All',
		action: 'Find all Projects',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/projects`,
			method: 'GET',
		});
	});
