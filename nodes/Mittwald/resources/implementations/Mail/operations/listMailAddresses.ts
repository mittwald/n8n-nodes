import { mailResource } from '../resource';

export default mailResource
	.addOperation({
		name: 'List Mail Addresses',
		action: 'List all mail addresses',
		description: 'Get a list of all mail addresses the user has access to',
		paginated: true,
	})
	.withProperties({})
	.withExecuteFn(async ({ apiClient, pagination }) => {
		return apiClient.requestList({
			path: '/mail-addresses/',
			pagination,
		});
	});
