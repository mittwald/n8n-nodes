import { serverResource } from '../resource';
import serverProperty from '../../shared/serverProperty';

export default serverResource
	.addOperation({
		name: 'Get',
		action: 'Get a server',
		description: 'Get details of a specific server',
	})
	.withProperties({
		server: serverProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { server } = properties;

		return apiClient.request({
			path: `/servers/${server}`,
			method: 'GET',
		});
	});
