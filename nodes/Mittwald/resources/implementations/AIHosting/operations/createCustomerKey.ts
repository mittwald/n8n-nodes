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
			description: 'The unique identifier of the customer',
			type: 'string',
			default: '',
			required: true,
		},
		keyName: {
			displayName: 'Name',
			description: 'Name of the AI hosting key; must be at least 5 characters long',
			type: 'string',
			default: '',
		},
		projectId: {
			displayName: 'Project ID',
			description: 'Optional project to scope the key to; leave empty for a customer-wide key',
			type: 'string',
			default: '',
		},
		createWebuiContainer: {
			displayName: 'Create Web UI Container',
			description: 'Whether to also create a web UI container for this key',
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
