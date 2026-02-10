import { serverResource } from '../resource';

export default serverResource
	.addOperation({
		name: 'list',
		action: 'List all servers',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/servers`,
			method: 'GET',
		});
	});
