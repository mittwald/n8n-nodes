import { serverResource } from '../resource';

export default serverResource
	.addOperation({
		name: 'List All',
		action: 'List all Servers',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/servers`,
			method: 'GET',
		});
	});
