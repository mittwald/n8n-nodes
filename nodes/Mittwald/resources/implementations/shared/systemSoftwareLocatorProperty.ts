import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'System Software',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'searchSystemSoftware',
	async searchListMethod(this, filter, paginationToken) {
		const apiClient = new ApiClient(this);
		const response = await apiClient.request({
			path: '/system-softwares',
			method: 'GET',
			pagination: { token: paginationToken },
			responseSchema: Z.array(
				Z.object({
					id: Z.string(),
					name: Z.string(),
				}),
			),
		});
		const normalizedFilter = (filter ?? '').toLowerCase();
		const matchingSystemSoftware = response.body.filter((software) =>
			normalizedFilter === '' ? true : software.name.toLowerCase().includes(normalizedFilter),
		);

		return {
			results: matchingSystemSoftware.map((software) => ({
				name: software.name,
				value: software.id,
			})),
			paginationToken: response.nextPaginationToken,
		};
	},
} satisfies OperationPropertyConfig;
