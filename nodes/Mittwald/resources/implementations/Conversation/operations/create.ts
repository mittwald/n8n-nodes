import conversationCategoryProperty from '../../shared/conversationCategoryProperty';
import { conversationResource } from '../resource';
import Z from 'zod';

export default conversationResource
	.addOperation({
		name: 'create',
		action: 'Create a ticket',
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

		const { userId } = await apiClient.request({
			path: `/users/self`,
			method: 'GET',
			responseSchema: Z.object({
				userId: Z.string(),
			}),
		});

		const createdConversation = await apiClient.request({
			path: `/conversations`,
			method: 'POST',
			requestSchema: Z.object({
				categoryId: Z.string(),
				mainUserId: Z.string(),
				title: Z.string(),
			}),
			responseSchema: Z.object({
				conversationId: Z.string(),
			}),
			body: {
				categoryId: conversationCategory,
				mainUserId: userId,
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
