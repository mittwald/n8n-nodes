import { contractResource } from '../resource';

export default contractResource
	.addOperation({
		name: 'List Invoices',
		action: 'List invoices',
		description: 'Get a list of invoices for a customer',
	})
	.withProperties({
		customerId: { displayName: 'Customer ID', type: 'string', default: '' },
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { customerId } = properties;

		return apiClient.request({
			path: `/customers/${customerId}/invoices`,
			method: 'GET',
		});
	});
