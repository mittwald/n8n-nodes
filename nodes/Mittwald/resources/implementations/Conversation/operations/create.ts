import conversationCategoryProperty from '../../shared/conversationCategoryProperty';
import { conversationResource } from '../resource';

export default conversationResource
	.addOperation({
		name: 'Create',
		action: 'Create a Ticket',
	})
	.withProperties({
		conversationCategory: conversationCategoryProperty,
		title: {
			displayName: 'Title',
			type: 'string',
			default: '',
		},
		message: {
			displayName: 'Message',
			type: 'string',
			default: '',
			typeOptions: {
				rows: 4,
			},
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { conversationCategory, title, message } = properties;

		interface UserInfo {
			userId: string;
		}

		interface CreatedConversation {
			conversationId: string;
		}

		const ownUser = await apiClient.request<UserInfo>({
			path: `/users/self`,
			method: 'GET',
		});

		const createdConversation = await apiClient.request<CreatedConversation>({
			path: `/conversations`,
			method: 'POST',
			body: {
				categoryId: conversationCategory,
				mainUserId: ownUser.userId,
				title,
			},
		});

		await apiClient.request({
			path: `/conversations/${createdConversation.conversationId}`,
			method: 'GET',
			polling: { waitUntil: { status: 200 } },
		});

		return await apiClient.request({
			path: `/conversations/${createdConversation.conversationId}/messages`,
			method: 'POST',
			body: {
				messageContent: message,
			},
		});
	});
