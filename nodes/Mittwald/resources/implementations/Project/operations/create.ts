import serverProperty from '../../shared/serverProperty';
import { projectResource } from '../resource';
import Z from 'zod';

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

		const project = await apiClient.request({
			path: `/servers/${server}/projects`,
			method: 'GET',
			responseSchema: Z.object({
				id: Z.string(),
			}),
			requestSchema: Z.object({ description: Z.string() }),
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
