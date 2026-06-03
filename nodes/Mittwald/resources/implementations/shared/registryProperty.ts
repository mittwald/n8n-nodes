import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Registry',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'searchRegistry',
	async searchListMethod(this, filter) {
		const projectParam = this.getCurrentNodeParameter('project') as { value: string };
		const projectId = projectParam?.value;
		if (!projectId) {
			return { results: [] };
		}

		const apiClient = new ApiClient(this);
		const registries = await apiClient.request({
			path: `/projects/${projectId}/registries`,
			method: 'GET',
			responseSchema: Z.array(
				Z.object({
					id: Z.string(),
					uri: Z.string(),
					description: Z.string(),
				}),
			),
		});

		const filterLower = (filter || '').toLowerCase();
		const filteredRegistries = filterLower
			? registries.filter(
					(registry) =>
						registry.uri.toLowerCase().includes(filterLower) ||
						registry.description.toLowerCase().includes(filterLower),
				)
			: registries;

		return {
			results: filteredRegistries.map((registry) => ({
				name: registry.uri,
				value: registry.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
