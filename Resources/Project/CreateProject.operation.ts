import { projectResource } from './Project.resource';
import { pollStatus } from '../types';

export const createProjectOperation = projectResource
	.createOperation({
		name: 'Create',
		action: 'Create Project on Server',
	})
	.withProperties({
		server: {
			name: 'server',
			displayName: 'Server',
			type: 'resourceLocator',
			searchListMethod: 'searchServer',
			default: null,
		},
		description: {
			name: 'description',
			displayName: 'Description',
			type: 'string',
			default: null,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, request } = context;
		const { server, description } = properties;

		const createResponse = await request.execute({
			path: `/servers/${server}/projects`,
			method: 'POST',
			body: {
				description,
			},
		});

		const getResponse = await request.executeWithPolling({
			path: `/projects/${createResponse.body.id}`,
			method: 'GET',
			waitUntil: pollStatus(200),
		});

		return getResponse.body;
	});
