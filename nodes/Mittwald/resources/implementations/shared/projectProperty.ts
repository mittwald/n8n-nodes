import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

// TODO: Helper class to config and map operation properties
export default {
	displayName: 'Project',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'searchProject',
	async searchListMethod(this, filter) {
		// TODO: Add support for pagination
		// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
		this.logger.info('fetching projects from mittwald API https://api.mittwald.de/v2/servers');

		interface Project {
			shortId: string;
			id: string;
			description: string;
		}

		const apiClient = new ApiClient(this);
		const projects = await apiClient.request<Array<Project>>({
			path: '/projects',
			method: 'GET',
			qs: {
				searchTerm: filter,
			},
		});

		return {
			results: projects.map((project) => ({
				name: `${project.description} (${project.shortId})`,
				value: project.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
