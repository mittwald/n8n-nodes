import { aiHostingResource } from '../resource';

export default aiHostingResource
	.addOperation({
		name: 'Delete Customer Key',
		action: 'Delete an AI hosting key from a customer',
		description: 'Delete an AI hosting API key scoped to a customer',
	})
	.withProperties({
		customerId: {
			displayName: 'Customer ID',
			type: 'string',
			default: '',
		},
		keyId: {
			displayName: 'Key ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { customerId, keyId } = properties;

		return apiClient.request({
			path: `/customers/${customerId}/ai-hosting-keys/${keyId}`,
			method: 'DELETE',
		});
	});
