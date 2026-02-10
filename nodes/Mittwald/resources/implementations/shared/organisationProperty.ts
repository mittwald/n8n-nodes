import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Organisation',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'searchOrganisation',
	async searchListMethod(this, filter, paginationToken) {
		const apiClient = new ApiClient(this);

		const response = await apiClient.request({
			path: '/customers',
			method: 'GET',
			qs: {
				search: filter,
			},
			responseSchema: Z.array(
				Z.object({
					customerId: Z.string(),
					customerNumber: Z.string(),
					name: Z.string(),
				}),
			),
			pagination: { token: paginationToken },
		});

		return {
			results: response.body.map((organisation) => ({
				name: `${organisation.name} (${organisation.customerNumber})`,
				value: organisation.customerId,
			})),
			paginationToken: response.nextPaginationToken,
		};
	},
} satisfies OperationPropertyConfig;
