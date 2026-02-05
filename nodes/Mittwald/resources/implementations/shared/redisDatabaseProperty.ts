import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

export default {
	displayName: 'Redis Database',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'searchRedisDatabase',
	async searchListMethod(this, filter) {
		interface RedisDatabase {
			id: string;
			description: string;
		}

		const apiClient = new ApiClient(this);
		const databases = await apiClient.request<Array<RedisDatabase>>({
			path: '/redis-databases',
			method: 'GET',
		});

		const filteredDatabases = filter
			? databases.filter((db) =>
					db.description.toLowerCase().includes(filter.toLowerCase()) ||
					db.id.toLowerCase().includes(filter.toLowerCase()),
				)
			: databases;

		return {
			results: filteredDatabases.map((database) => ({
				name: database.description || database.id,
				value: database.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
