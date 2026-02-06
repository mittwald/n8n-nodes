import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Get',
		action: 'Get a project',
	})
	.withProperties({
		projectId: {
			displayName: 'Project ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { projectId } = properties;

		return apiClient.request({
			path: `/projects/${projectId}`,
			method: 'GET',
		});
	});
