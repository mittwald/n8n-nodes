/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import { env } from './helpers/runtime';
import { integrationDescribe, readRequiredString, testcase } from './testcase';

const membershipId = env('IT_PROJECT_MEMBERSHIP_ID');
const membershipDeleteId = env('IT_PROJECT_MEMBERSHIP_DELETE_ID');

const membershipDescribe = membershipId ? describe : describe.skip;
const membershipDeleteDescribe = membershipDeleteId ? describe : describe.skip;

integrationDescribe('Project / Membership (integration)', () => {
	membershipDescribe('Get Membership', () => {
		testcase('gets a membership by id', async (context) => {
			if (!membershipId) {
				throw new Error('Missing IT_PROJECT_MEMBERSHIP_ID');
			}

			const result = await context.runOperation({
				resource: 'Project',
				operation: 'Get Membership',
				parameters: {
					projectMembershipId: membershipId,
				},
			});

			const id = readRequiredString(result.firstItem.json, 'id');
			expect(id).toBe(membershipId);
		});
	});

	membershipDeleteDescribe('Delete Membership', () => {
		testcase(
			'deletes a membership by id',
			async (context) => {
				if (!membershipDeleteId) {
					throw new Error('Missing IT_PROJECT_MEMBERSHIP_DELETE_ID');
				}

				const result = await context.runOperation({
					resource: 'Project',
					operation: 'Delete Membership',
					parameters: {
						projectMembershipId: membershipDeleteId,
					},
				});

				expect(result.items.length).toBeGreaterThan(0);
			},
			30_000,
		);
	});
});
