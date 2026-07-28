import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Version',
	type: 'resourceLocator',
	required: false,
	default: null,
	searchListMethodName: 'searchInstallationVersionProperty',
	async searchListMethod(this, filter) {
		const installationId = this.getCurrentNodeParameter('appInstallation') as { value: string };

		const apiClient = new ApiClient(this);

		const appInstallation = await apiClient.request({
			path: `/app-installations/${installationId.value}`,
			responseSchema: Z.object({
				appId: Z.string(),
				// `current` is absent while the very first install is still running.
				appVersion: Z.object({
					current: Z.string().optional(),
					desired: Z.string(),
				}),
			}),
			method: 'GET',
		});
		const appId = appInstallation.appId;
		// An update in flight already defines the version the next one starts from,
		// so `desired` is the base even when it has not been reached yet.
		const baseVersionId = appInstallation.appVersion.desired;

		// Listing all versions of the app would offer downgrades and versions with
		// no upgrade path, which the API rejects at execution time.
		const versions = await apiClient.request({
			path: `/apps/${appId}/versions/${baseVersionId}/update-candidates`,
			method: 'GET',
			responseSchema: Z.array(
				Z.object({
					id: Z.string(),
					externalVersion: Z.string(),
				}),
			),
		});

		// The endpoint takes no search term, so the filter is applied here.
		const matches = filter
			? versions.filter((version) =>
					version.externalVersion.toLowerCase().includes(filter.toLowerCase()),
				)
			: versions;

		return {
			results: matches.map((version) => ({
				name: `${version.externalVersion}`,
				value: version.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
