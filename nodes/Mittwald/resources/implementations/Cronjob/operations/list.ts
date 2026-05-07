import projectProperty from '../../shared/projectProperty';
import { cronjobResource } from '../resource';

export default cronjobResource
	.addOperation({
		name: 'List',
		action: 'List all cronjobs',
		description: 'Get a list of all cronjobs in a project',
	})
	.withProperties({
		project: projectProperty,
		includeServiceCronjobs: {
			displayName: 'Include Service Cronjobs',
			type: 'boolean',
			default: false,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project, includeServiceCronjobs } = properties;

		return apiClient.request({
			path: `/projects/${project}/cronjobs`,
			method: 'GET',
			qs: {
				includeServiceCronjobs,
			},
		});
	});
