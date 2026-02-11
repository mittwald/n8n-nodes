import { databaseResource } from '../resource';
import projectProperty from '../../shared/projectProperty';
import redisVersionProperty from '../../shared/redisVersionProperty';
import Z from 'zod';

export default databaseResource
	.addOperation({
		name: 'Create Redis Database',
		action: 'Create Redis database',
		description: 'Create a new Redis database in a project',
	})
	.withProperties({
		project: projectProperty,
		description: {
			displayName: 'Name',
			type: 'string',
			default: '',
		},
		version: redisVersionProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project, description, version } = properties;

		const redisDatabase = await apiClient.request({
			path: `/projects/${project}/redis-databases`,
			method: 'POST',
			requestSchema: Z.object({
				description: Z.string(),
				version: Z.string(),
			}),
			responseSchema: Z.object({
				id: Z.string().uuid(),
			}),
			body: {
				description,
				version,
			},
		});

		return apiClient.request({
			path: `/redis-databases/${redisDatabase.id}`,
			method: 'GET',
			polling: {
				waitUntil: {
					status: 200,
				},
			},
		});
	});
