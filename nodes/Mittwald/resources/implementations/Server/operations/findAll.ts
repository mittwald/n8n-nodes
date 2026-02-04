import { serverResource } from '../resource';

export default serverResource
	.addOperation({
		name: 'Find All',
		action: 'Find all Servers',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/servers`,
			method: 'GET',
		});
	});
