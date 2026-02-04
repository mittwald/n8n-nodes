import { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { ApiClient } from '../../api/ApiClient';
import type { OperationPropertyConfig } from '../base';

// TODO: Helper class to config and map operation properties
const conversationCategoryProperty: OperationPropertyConfig = {
	displayName: 'Conversation Category',
	name: 'conversationCategory',
	type: 'resourceLocator',
	searchListMethod: 'searchConversationCategories',
	default: '',
} satisfies OperationPropertyConfig;

export async function searchConversationCategories(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
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
}

export default conversationCategoryProperty;
