import { serverResource } from '../resource';

export default serverResource
	.addOperation({
		name: 'Get',
		action: 'Get a Server',
	})
	.withProperties({
		serverId: {
			displayName: 'Server ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { serverId } = properties;

		return apiClient.request({
			path: `/servers/${serverId}`,
			method: 'GET',
		});
	});
