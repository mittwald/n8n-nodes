import projectProperty from '../../shared/projectProperty';
import { mailResource } from '../resource';

export default mailResource
	.addOperation({
		name: 'List Mail Addresses By Project',
		action: 'List mail addresses for a project',
		description: 'Get a list of mail addresses in a project',
	})
	.withProperties({
		project: projectProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project } = properties;

		return apiClient.request({
			path: `/projects/${project}/mail-addresses`,
			method: 'GET',
		});
	});
