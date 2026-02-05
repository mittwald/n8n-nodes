import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

export default {
	displayName: 'Redis Version',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listRedisVersions',
	async searchListMethod(this, filter) {
		interface RedisVersion {
			id: string;
			name: string;
			disabled: boolean;
		}

		const apiClient = new ApiClient(this);

		const versions = await apiClient.request<Array<RedisVersion>>({
			path: `/redis-versions`,
			method: 'GET',
		});

		// Filter out disabled versions
		const enabledVersions = versions.filter((v) => !v.disabled);

		const filteredVersions = filter
			? enabledVersions.filter((v) =>
					v.name.toLowerCase().includes(filter.toLowerCase()) ||
					v.id.toLowerCase().includes(filter.toLowerCase()),
				)
			: enabledVersions;

		return {
			results: filteredVersions.map((version) => ({
				name: version.name,
				value: version.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
