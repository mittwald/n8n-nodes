import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Conversation',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'searchConversation',
	async searchListMethod(this, filter, paginationToken) {
		const apiClient = new ApiClient(this);

		const response = await apiClient.request({
			path: '/conversations',
			method: 'GET',
			qs: {
				fullTextSearch: filter,
			},
			pagination: {
				token: paginationToken,
			},
			responseSchema: Z.array(
				Z.object({
					conversationId: Z.string(),
					shortId: Z.string(),
					title: Z.string(),
				}),
			),
		});

		return {
			results: response.body.map((conversation) => ({
				name: `${conversation.title} (${conversation.shortId})`,
				value: conversation.conversationId,
			})),
			paginationToken: response.nextPaginationToken,
		};
	},
} satisfies OperationPropertyConfig;
