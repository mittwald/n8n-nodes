import { conversationResource } from '../resource';

export default conversationResource
	.addOperation({
		name: 'List',
		action: 'List conversations',
		description: 'Get all conversations the authenticated user has created or has access to',
		paginated: true,
	})
	.withProperties({})
	.withExecuteFn(async ({ apiClient, pagination }) => {
		return apiClient.requestList({
			path: `/conversations`,
			pagination,
		});
	});
