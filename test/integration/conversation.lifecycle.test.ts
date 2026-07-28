/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

type ConversationCategory = {
	categoryId: string;
};

type ConversationApi = {
	listCategories: () => Promise<{
		status: number;
		statusText: string;
		data: ConversationCategory[];
	}>;
	setConversationStatus?: (input: {
		conversationId: string;
		data: { status: 'closed' };
	}) => Promise<unknown>;
};

integrationDescribe('Conversation / Lifecycle (integration)', () => {
	testcase(
		'creates a conversation, sends a message, lists messages, and gets the conversation',
		async (context) => {
			const conversationApi = context.mittwaldApi.conversation as unknown as ConversationApi;
			const categoryId = await getFirstConversationCategoryId(conversationApi);
			const title = `it-${runId('conversation-flow')}`;
			const message = 'integration test ping';

			const teardownState: { createdConversationId?: string } = {};
			context.teardown(async () => {
				if (!teardownState.createdConversationId || !conversationApi.setConversationStatus) {
					return;
				}

				await conversationApi.setConversationStatus({
					conversationId: teardownState.createdConversationId,
					data: { status: 'closed' },
				});
			});

			const result = await context
				.scenario('Conversation lifecycle')
				.step({
					name: 'Create Conversation',
					resource: 'Support',
					operation: 'Create',
					parameters: {
						conversationCategory: {
							mode: 'id',
							value: categoryId,
						},
						title,
						message: 'integration test start',
					},
				})
				.step({
					name: 'Create Message',
					resource: 'Support',
					operation: 'Create Message',
					parameters: {
						conversation: fromStep('Create Conversation', 'conversationId'),
						message,
					},
				})
				.step({
					name: 'List Messages',
					resource: 'Support',
					operation: 'List Messages',
					parameters: {
						conversation: fromStep('Create Conversation', 'conversationId'),
					},
				})
				.step({
					name: 'Get Conversation',
					resource: 'Support',
					operation: 'Get',
					parameters: {
						conversation: fromStep('Create Conversation', 'conversationId'),
					},
				})
				.run();

			teardownState.createdConversationId = result
				.step('Create Conversation')
				.requireString('conversationId');

			expect(result.step('Create Message').requireString('conversationId')).toBe(
				teardownState.createdConversationId,
			);
			expect(result.step('List Messages').stringValues('messageContent')).toContain(message);
			expect(result.step('Get Conversation').requireString('conversationId')).toBe(
				teardownState.createdConversationId,
			);
			expect(result.step('Get Conversation').requireString('title')).toBe(title);
		},
		60_000,
	);
});

async function getFirstConversationCategoryId(
	conversationApi: ConversationApi,
): Promise<string> {
	const response = await conversationApi.listCategories();

	if (response.status !== 200) {
		throw new Error(`Failed to list conversation categories: ${response.statusText}`);
	}

	const firstCategory = response.data[0];
	if (!firstCategory) {
		throw new Error('No conversation categories are available for integration testing');
	}

	return firstCategory.categoryId;
}
