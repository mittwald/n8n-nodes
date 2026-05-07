import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Stack',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'searchStack',
	async searchListMethod(this, filter, paginationToken) {
		const apiClient = new ApiClient(this);

		const response = await apiClient.request({
			path: '/stacks',
			method: 'GET',
			pagination: { token: paginationToken },
			responseSchema: Z.array(
				Z.object({
					id: Z.string(),
					projectId: Z.string(),
					description: Z.string(),
				}),
			),
		});

		const filterLower = (filter || '').toLowerCase();
		const stacks = filterLower
			? response.body.filter((stack) =>
					(stack.description || stack.id).toLowerCase().includes(filterLower),
				)
			: response.body;

		return {
			results: stacks.map((stack) => ({
				name: stack.description || stack.id,
				value: stack.id,
			})),
			paginationToken: response.nextPaginationToken,
		};
	},
} satisfies OperationPropertyConfig;
