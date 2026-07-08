import { aiHostingResource } from '../resource';

export default aiHostingResource
	.addOperation({
		name: 'Get Customer Usage',
		action: 'Get AI hosting usage for a customer',
		description: 'Get the AI hosting plan and usage details of a customer',
	})
	.withProperties({
		customerId: {
			displayName: 'Customer ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { customerId } = properties;

		return apiClient.request({
			path: `/customers/${customerId}/ai-hosting`,
			method: 'GET',
		});
	});
