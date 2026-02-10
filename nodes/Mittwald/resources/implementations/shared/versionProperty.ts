import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Version',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listVersions',
	async searchListMethod(this) {
		const appId = this.getCurrentNodeParameter('software') as { value: string };

		const apiClient = new ApiClient(this);

		const versions = await apiClient.request({
			path: `/apps/${appId.value}/versions`,
			method: 'GET',
			responseSchema: Z.array(
				Z.object({
					id: Z.string(),
					externalVersion: Z.string(),
				}),
			),
		});

		return {
			results: versions.map((version) => ({
				name: `${version.externalVersion}`,
				value: version.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
