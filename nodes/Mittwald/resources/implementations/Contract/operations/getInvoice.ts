import { contractResource } from '../resource';

export default contractResource
	.addOperation({
		name: 'Get Invoice',
		action: 'Get an invoice',
		description: 'Get details of an invoice',
	})
	.withProperties({
		invoiceId: {
			displayName: 'Invoice ID',
			description: 'The unique identifier of the invoice',
			type: 'string',
			default: '',
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { invoiceId } = properties;

		return apiClient.request({
			path: `/invoices/${invoiceId}`,
			method: 'GET',
		});
	});
