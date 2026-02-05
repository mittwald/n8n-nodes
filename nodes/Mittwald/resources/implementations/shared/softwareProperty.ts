import { INodeListSearchResult } from 'n8n-workflow';
import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

// TODO: Helper class to config and map operation properties
export default {
	displayName: 'Software (Apps)',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listApps',
	async searchListMethod(this, filter): Promise<INodeListSearchResult> {
		// TODO: Add support for pagination
		// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
		interface App {
			name: string;
			id: string;
			tags: string[];
		}

		const apiClient = new ApiClient(this);
		const apps = await apiClient.request<Array<App>>({
			path: '/apps',
			method: 'GET',
			qs: {
				searchTerm: filter,
			},
		});

		return {
			results: apps.map((app) => ({
				name: `${app.name}`,
				value: app.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
