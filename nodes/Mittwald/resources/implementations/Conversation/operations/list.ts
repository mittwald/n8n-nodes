import { conversationResource } from '../resource';

export default conversationResource
	.addOperation({
		name: 'List',
		action: 'List conversations',
		description: 'Get all conversations the authenticated user has created or has access to',
	})
	.withProperties({})
	.withExecuteFn(async ({ apiClient }) => {
		return apiClient.request({
			path: `/conversations`,
			method: 'GET',
		});
	});
