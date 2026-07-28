import conversationProperty from '../../shared/conversationProperty';
import { conversationResource } from '../resource';

export default conversationResource
	.addOperation({
		name: 'Get',
		action: 'Get a conversation',
		description: 'Get details of a specific conversation',
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
			path: `/conversations/${conversation}`,
			method: 'GET',
		});
	});
