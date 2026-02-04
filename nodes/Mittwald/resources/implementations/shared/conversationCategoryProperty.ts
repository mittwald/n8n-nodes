import type { OperationPropertyConfig } from '../../base';
import { ApiClient } from '../../../api';

// TODO: Helper class to config and map operation properties
export default {
	displayName: 'Conversation Category',
	type: 'resourceLocator',
	searchListMethodName: 'searchConversationCategories',
	default: '',
	async searchListMethod(this, filter) {
		const apiClient = new ApiClient(this);

		interface ConversationCategory {
			categoryId: string;
			name: string;
			referenceType: string[];
		}

		const categories = await apiClient.request<Array<ConversationCategory>>({
			path: '/conversation-categories',
			method: 'GET',
			qs: {
				searchTerm: filter,
			},
		});

		return {
			results: categories.map((category) => ({
				name: category.name,
				value: category.categoryId,
			})),
		};
	},
} satisfies OperationPropertyConfig;
