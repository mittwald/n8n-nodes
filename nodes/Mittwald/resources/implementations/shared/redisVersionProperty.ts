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
		}

		const apiClient = new ApiClient(this);

		const versions = await apiClient.request<Array<RedisVersion>>({
			path: `/redis-versions`,
			method: 'GET',
		});

		const filteredVersions = filter
			? versions.filter((v) =>
					v.name.toLowerCase().includes(filter.toLowerCase()) ||
					v.id.toLowerCase().includes(filter.toLowerCase()),
				)
			: versions;

		return {
			results: filteredVersions.map((version) => ({
				name: version.name,
				value: version.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
