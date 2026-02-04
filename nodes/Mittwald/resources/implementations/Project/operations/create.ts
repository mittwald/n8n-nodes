import serverProperty from '../../shared/serverProperty';
import { projectResource } from '../resource';

projectResource
	.addOperation({
		name: 'Create',
		action: 'Create Project on Server',
	})
	.withProperties({
		server: serverProperty,
		description: {
			displayName: 'Description',
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
