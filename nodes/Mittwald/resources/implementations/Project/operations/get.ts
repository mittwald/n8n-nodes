import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Get',
		action: 'Get a Project',
	})
	.withProperties({
		projectId: {
			displayName: 'Project ID',
			name: 'projectId',
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
