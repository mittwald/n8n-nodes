import { mailResource } from '../resource';

export default mailResource
	.addOperation({
		name: 'List Mail Addresses',
		action: 'List all mail addresses',
		description: 'Get a list of all mail addresses the user has access to',
	})
	.withProperties({})
	.withExecuteFn(async ({ apiClient }) => {
		return apiClient.request({
			path: '/mail-addresses/',
			method: 'GET',
		});
	});
