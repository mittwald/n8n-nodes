import { appResource } from '../resource';
import projectProperty from '../../shared/projectProperty';

export default appResource
	.addOperation({
		name: 'List Installations By Project',
		action: 'List app installations of a project',
		description: 'Get a list of app installations belonging to a project',
		paginated: true,
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project } = properties;

		return apiClient.requestList({
			path: `/projects/${project}/app-installations`,
			pagination: context.pagination,
		});
	});
