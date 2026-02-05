import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Project',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'searchProject',
	async searchListMethod(this, filter, paginationToken) {
		const apiClient = new ApiClient(this);

		const response = await apiClient.request({
			path: '/projects',
			method: 'GET',
			qs: {
				searchTerm: filter,
			},
			pagination: {
				token: paginationToken,
			},
			responseSchema: Z.array(
				Z.object({
					shortId: Z.string(),
					id: Z.string(),
					description: Z.string(),
				}),
			),
		});

		return {
			results: response.body.map((project) => ({
				name: `${project.description} (${project.shortId})`,
				value: project.id,
			})),
			paginationToken: response.nextPaginationToken,
		};
	},
} satisfies OperationPropertyConfig;
