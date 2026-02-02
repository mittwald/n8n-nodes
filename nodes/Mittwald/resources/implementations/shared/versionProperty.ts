import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

export default {
	displayName: 'Version',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listVersions',
	async searchListMethod(this, filter) {
		// TODO: Add support for pagination
		// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
		const appId = this.getCurrentNodeParameter('software') as { value: string };

		interface App {
			id: string;
			externalVersion: string;
		}

		const apiClient = new ApiClient(this);

		const versions = await apiClient.request<Array<App>>({
			path: `/apps/${appId.value}/versions`,
			method: 'GET',
			qs: {
				searchTerm: filter,
			},
		});

		return {
			results: versions.map((version) => ({
				name: `${version.externalVersion}`,
				value: version.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
