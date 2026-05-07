import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Customer',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'searchCustomer',
	async searchListMethod(this, filter, paginationToken) {
		const apiClient = new ApiClient(this);

		const response = await apiClient.request({
			path: '/customers',
			method: 'GET',
			qs: {
				search: filter,
			},
			pagination: {
				token: paginationToken,
			},
			responseSchema: Z.array(
				Z.object({
					customerId: Z.string(),
					customerNumber: Z.string(),
					name: Z.string(),
				}),
			),
		});

		return {
			results: response.body.map((customer) => ({
				name: `${customer.name} (${customer.customerNumber})`,
				value: customer.customerId,
			})),
			paginationToken: response.nextPaginationToken,
		};
	},
} satisfies OperationPropertyConfig;
