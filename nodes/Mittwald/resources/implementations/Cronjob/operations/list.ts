import projectProperty from '../../shared/projectProperty';
import { cronjobResource } from '../resource';

export default cronjobResource
	.addOperation({
		name: 'List',
		action: 'List all cronjobs',
		description: 'Get a list of all cronjobs in a project',
		paginated: true,
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		includeServiceCronjobs: {
			displayName: 'Include Service Cronjobs',
			description: 'Whether to also return cronjobs managed by container services',
			type: 'boolean',
			default: false,
		},
	})
	.withExecuteFn(async ({ properties, apiClient, pagination }) => {
		const { project, includeServiceCronjobs } = properties;

		return apiClient.requestList({
			path: `/projects/${project}/cronjobs`,
			qs: {
				includeServiceCronjobs,
			},
			pagination,
		});
	});
