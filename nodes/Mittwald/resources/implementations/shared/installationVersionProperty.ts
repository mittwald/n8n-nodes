import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

export default {
	displayName: 'Version',
	type: 'resourceLocator',
	required: false,
	default: '',
	searchListMethodName: 'listVersions',
	async searchListMethod(this, filter) {
		// TODO: Add support for pagination
		// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
		const installationId = this.getCurrentNodeParameter('appInstallation') as { value: string };

		interface App {
			id: string;
			externalVersion: string;
		}

		const apiClient = new ApiClient(this);

		const appInstallation = await apiClient.request<{
			appId: string;
		}>({
			path: '/app-installations/' + installationId.value,
			method: 'GET',
		});
		const appId = appInstallation.appId;

		const versions = await apiClient.request<Array<App>>({
			path: `/apps/${appId}/versions`,
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
