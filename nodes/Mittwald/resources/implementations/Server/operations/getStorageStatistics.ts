import serverProperty from '../../shared/serverProperty';
import { serverResource } from '../resource';

export default serverResource
	.addOperation({
		name: 'Get Storage Statistics',
		action: 'Get storage statistics',
		description: 'Get storage usage statistics for a server',
	})
	.withProperties({
		server: serverProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { server } = properties;

		return apiClient.request({
			path: `/servers/${server}/storage-space-statistics`,
			method: 'GET',
		});
	});
