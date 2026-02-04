import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

export default {
	displayName: 'Server',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listServers',
	async searchListMethod(this, filter) {
		// TODO: Add support for pagination
		// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
		this.logger.info('fetching servers from mittwald API https://api.mittwald.de/v2/servers');

		interface Server {
			shortId: string;
			id: string;
			description: string;
		}

		const apiClient = new ApiClient(this);
		const servers = await apiClient.request<Array<Server>>({
			path: '/servers',
			method: 'GET',
			qs: {
				searchTerm: filter,
			},
		});

		return {
			results: servers.map((server) => ({
				name: `${server.description} (${server.shortId})`,
				value: server.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
