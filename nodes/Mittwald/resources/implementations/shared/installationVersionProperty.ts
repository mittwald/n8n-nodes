import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Version',
	type: 'resourceLocator',
	required: false,
	default: null,
	searchListMethodName: 'listInstallationVersions',
	async searchListMethod(this, filter) {
		const installationId = this.getCurrentNodeParameter('appInstallation') as { value: string };

		const apiClient = new ApiClient(this);

		const appInstallation = await apiClient.request({
			path: `/app-installations/${installationId.value}`,
			responseSchema: Z.object({ appId: Z.string() }),
			method: 'GET',
		});
		const appId = appInstallation.appId;

		const versions = await apiClient.request({
			path: `/apps/${appId}/versions`,
			method: 'GET',
			responseSchema: Z.array(
				Z.object({
					id: Z.string(),
					externalVersion: Z.string(),
				}),
			),
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
