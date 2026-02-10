import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Server',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listServers',
	async searchListMethod(this, filter, paginationToken) {
		const apiClient = new ApiClient(this);
		const servers = await apiClient.request({
			path: '/servers',
			method: 'GET',
			qs: {
				searchTerm: filter,
			},
			pagination: { token: paginationToken },
			responseSchema: Z.array(
				Z.object({
					shortId: Z.string(),
					id: Z.string(),
					description: Z.string(),
				}),
			),
		});

		return {
			results: servers.body.map((server) => ({
				name: `${server.description} (${server.shortId})`,
				value: server.id,
			})),
			paginationToken: servers.nextPaginationToken,
		};
	},
} satisfies OperationPropertyConfig;
