import { INodeListSearchResult } from 'n8n-workflow';
import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Apps',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listApps',
	async searchListMethod(this, _, paginationToken): Promise<INodeListSearchResult> {
		const apiClient = new ApiClient(this);
		const apps = await apiClient.request({
			path: '/apps',
			method: 'GET',
			responseSchema: Z.array(
				Z.object({
					name: Z.string(),
					id: Z.string(),
					tags: Z.array(Z.string()),
				}),
			),
			pagination: { token: paginationToken },
		});

		return {
			results: apps.body.map((app) => ({
				name: `${app.name}`,
				value: app.id,
			})),
			paginationToken: apps.nextPaginationToken,
		};
	},
} satisfies OperationPropertyConfig;
