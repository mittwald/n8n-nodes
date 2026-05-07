import { aiHostingResource } from '../resource';
import Z from 'zod';

export default aiHostingResource
	.addOperation({
		name: 'Create Customer Key',
		action: 'Create an AI hosting key for a customer',
		description: 'Create a new AI hosting API key scoped to a customer',
	})
	.withProperties({
		customerId: {
			displayName: 'Customer ID',
			type: 'string',
			default: '',
		},
		keyName: {
			displayName: 'Name',
			type: 'string',
			default: '',
		},
		projectId: {
			displayName: 'Project ID',
			type: 'string',
			default: '',
		},
		createWebuiContainer: {
			displayName: 'Create Web UI Container',
			type: 'boolean',
			default: false,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { customerId, keyName, projectId, createWebuiContainer } = properties;

		return apiClient.request({
			path: `/customers/${customerId}/ai-hosting-keys`,
			method: 'POST',
			requestSchema: Z.object({
				name: Z.string().min(5),
				createWebuiContainer: Z.boolean().optional(),
				projectId: Z.string().optional(),
			}),
			body: {
				name: keyName,
				createWebuiContainer,
				projectId: projectId || undefined,
			},
		});
	});
