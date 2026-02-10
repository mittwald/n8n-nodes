import type { OperationPropertyConfig } from '../../base';
import { ApiClient } from '../../../api';
import Z from 'zod';

export default {
	displayName: 'Conversation Category',
	type: 'resourceLocator',
	searchListMethodName: 'searchConversationCategories',
	default: '',
	async searchListMethod(this) {
		const apiClient = new ApiClient(this);

		const response = await apiClient.request({
			path: '/conversation-categories',
			method: 'GET',
			responseSchema: Z.array(
				Z.object({
					categoryId: Z.string(),
					name: Z.string(),
					referenceType: Z.array(Z.string()),
				}),
			),
		});

		return {
			results: response.map((category) => ({
				name: category.name,
				value: category.categoryId,
			})),
		};
	},
} satisfies OperationPropertyConfig;
