import conversationProperty from '../../shared/conversationProperty';
import { conversationResource } from '../resource';
import Z from 'zod';

export default conversationResource
	.addOperation({
		name: 'Create Message',
		action: 'Send a message',
		description: 'Send a new message in a conversation',
	})
	.withProperties({
		conversation: conversationProperty,
		message: {
			displayName: 'Message',
			description: 'Message body to append to the conversation',
			type: 'string',
			default: '',
			typeOptions: {
				rows: 4,
			},
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { conversation, message } = properties;

		return apiClient.request({
			path: `/conversations/${conversation}/messages`,
			method: 'POST',
			requestSchema: Z.object({
				messageContent: Z.string(),
			}),
			body: {
				messageContent: message,
			},
		});
	});
