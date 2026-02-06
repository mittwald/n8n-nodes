import { redisDatabaseResource } from '../resource';
import projectProperty from '../../shared/projectProperty';
import redisVersionProperty from '../../shared/redisVersionProperty';
import {
	CreateRedisDatabaseRequestSchema,
	CreateRedisDatabaseResponseSchema,
	RedisDatabaseSchema,
} from '../schemas';

export default redisDatabaseResource
	.addOperation({
		name: 'Create',
		action: 'Create Redis database',
	})
	.withProperties({
		project: projectProperty,
		description: {
			displayName: 'Description',
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
			requestSchema: CreateRedisDatabaseRequestSchema,
			responseSchema: CreateRedisDatabaseResponseSchema,
			body: {
				description,
				version,
			},
		});

		return apiClient.request({
			path: `/redis-databases/${redisDatabase.id}`,
			method: 'GET',
			responseSchema: RedisDatabaseSchema,
			polling: {
				waitUntil: {
					status: 200,
				},
			},
		});
	});
