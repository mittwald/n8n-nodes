import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

export default {
	displayName: 'MySQL Version',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listMySqlVersions',
	async searchListMethod(this, filter) {
		interface MySqlVersion {
			id: string;
			name: string;
			disabled: boolean;
			number: string;
		}

		const apiClient = new ApiClient(this);

		const versions = await apiClient.request<Array<MySqlVersion>>({
			path: `/mysql-versions`,
			method: 'GET',
		});

		const enabledVersions = versions.filter((v) => !v.disabled);

		const filteredVersions = filter
			? enabledVersions.filter(
					(v) =>
						v.name.toLowerCase().includes(filter.toLowerCase()) ||
						v.id.toLowerCase().includes(filter.toLowerCase()),
				)
			: enabledVersions;

		return {
			results: filteredVersions.map((version) => ({
				name: version.name,
				value: version.number,
			})),
		};
	},
} satisfies OperationPropertyConfig;
