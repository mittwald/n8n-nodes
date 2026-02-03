import serverProperty from '../../../operationProperties/serverProperty';
import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Create',
		action: 'Create Project on Server',
	})
	.withProperties({
		server: serverProperty,
		description: {
			displayName: 'Description',
			name: 'description',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { server, description } = properties;

		interface CreateProjectResponseBody {
			id: string;
		}

		const project = await apiClient.request<CreateProjectResponseBody>({
			path: `/servers/${server}/projects`,
			method: 'GET',
			body: {
				description,
			},
		});

		return apiClient.request({
			path: `/projects/${project.id}`,
			method: 'GET',
			polling: {
				waitUntil: {
					status: 200,
				},
			},
		});
	});
