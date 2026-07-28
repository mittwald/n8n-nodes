import projectProperty from '../../shared/projectProperty';
import { aiHostingResource } from '../resource';

export default aiHostingResource
	.addOperation({
		name: 'Delete Project Key',
		action: 'Delete an AI hosting key from a project',
		description: 'Delete an AI hosting API key scoped to a project',
	})
	.withProperties({
		project: projectProperty,
		keyId: {
			displayName: 'Key ID',
			description: 'The unique identifier of the AI hosting key',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project, keyId } = properties;

		return apiClient.request({
			path: `/projects/${project}/ai-hosting-keys/${keyId}`,
			method: 'DELETE',
		});
	});
