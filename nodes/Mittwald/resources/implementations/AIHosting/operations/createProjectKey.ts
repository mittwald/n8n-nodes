import projectProperty from '../../shared/projectProperty';
import { aiHostingResource } from '../resource';
import Z from 'zod';

export default aiHostingResource
	.addOperation({
		name: 'Create Project Key',
		action: 'Create an AI hosting key for a project',
		description: 'Create a new AI hosting API key scoped to a project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		keyName: {
			displayName: 'Name',
			description: 'Name of the AI hosting key; must be at least 5 characters long',
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
		const { project, keyName, createWebuiContainer } = properties;

		return apiClient.request({
			path: `/projects/${project}/ai-hosting-keys`,
			method: 'POST',
			requestSchema: Z.object({
				name: Z.string().min(5),
				createWebuiContainer: Z.boolean().optional(),
			}),
			body: {
				name: keyName,
				createWebuiContainer,
			},
		});
	});
