import conversationProperty from '../../shared/conversationProperty';
import { conversationResource } from '../resource';

export default conversationResource
	.addOperation({
		name: 'List Messages',
		action: 'List conversation messages',
		description: 'Get all messages of a conversation',
	})
	.withProperties({
		conversation: {
			...conversationProperty,
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { conversation } = properties;

		return apiClient.request({
			path: `/conversations/${conversation}/messages`,
			method: 'GET',
		});
	});
