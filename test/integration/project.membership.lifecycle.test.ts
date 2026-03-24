/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import {
	createMittwaldWorkflow,
	MittwaldApiClient,
	N8nApiClient,
	nodeIdReference,
	runId,
} from './helpers';
import { HttpError } from './helpers/http';
import { sleep } from './helpers/runtime';
import { integrationDescribe, readOptionalString, readRequiredString, testcase } from './testcase';
const inviteCredentialType = 'mittwaldApi';

integrationDescribe('Project / Invites (integration)', () => {
	testcase(
		'creates, lists, and accepts an invite for a project',
		async (context) => {
			const inviteTarget = context.env.inviteTarget;
			const inviteUserToken = context.env.inviteUserToken;
			if (!inviteTarget) {
				throw new Error('Missing IT_INVITE_TARGET for invite tests.');
			}
			if (!inviteUserToken) {
				throw new Error('Missing IT_INVITE_USER_TOKEN for invite tests.');
			}

			const inviteUserApi = new MittwaldApiClient(inviteUserToken);
			const n8nClient = await N8nApiClient.getInstance(context.env);
			const inviteUserCredential = await n8nClient.createCredential({
				name: runId('mittwald-it-invite-user'),
				type: inviteCredentialType,
				data: {
					apiKey: inviteUserToken,
					allowedDomains: 'All',
				},
			});
			context.teardown(async () => {
				await n8nClient.deleteCredential(inviteUserCredential.id);
			});

			const projectDescription = `it-${runId('invite-project')}`;
			const inviteMessage = `it-${runId('invite-message')}`;
			const createProjectStep = {
				name: 'Create Project',
				resource: 'Project',
				operation: 'Create',
				parameters: {
					server: {
						mode: 'id',
						value: context.env.testServerId,
					},
					description: projectDescription,
				},
			} as const;
			const createInviteStep = {
				name: 'Create Invite',
				resource: 'Project',
				operation: 'Create Invite',
				parameters: {
					project: nodeIdReference(createProjectStep.name),
					mailAddress: inviteTarget,
					role: 'external',
					message: inviteMessage,
				},
			} as const;
			const listInvitesStep = {
				name: 'List Invites',
				resource: 'Project',
				operation: 'List Invites',
				parameters: {
					project: nodeIdReference(createProjectStep.name),
				},
			} as const;
			const result = await context.runWorkflow({
				workflow: createMittwaldWorkflow(context.env, [
					createProjectStep,
					createInviteStep,
					listInvitesStep,
				]),
			});

			const createdProjectItems = result.getNodeItems(createProjectStep.name, {
				allowEmpty: false,
			});
			const projectId = readRequiredString(createdProjectItems[0]?.json ?? {}, 'id');
			context.teardown(async () => {
				await context.mittwaldApi.deleteProject(projectId);
			});

			const createdInviteItems = result.getNodeItems(createInviteStep.name, { allowEmpty: false });
			const inviteId = readRequiredString(createdInviteItems[0]?.json ?? {}, 'id');

			const listedInviteItems = result.getNodeItems(listInvitesStep.name, { allowEmpty: false });
			const listedInviteIds = listedInviteItems
				.map((item) => readOptionalString(item.json, 'id'))
				.filter((value): value is string => Boolean(value));
			expect(listedInviteIds).toContain(inviteId);

			const acceptInviteWorkflow = await context.runWorkflow({
				workflow: createMittwaldWorkflow(context.env, [
					{
						name: 'Accept Invite',
						resource: 'Project',
						operation: 'Accept Invite',
						credential: inviteUserCredential,
						parameters: {
							projectInviteId: inviteId,
						},
					},
				]),
			});

			const acceptedInviteItems = acceptInviteWorkflow.getNodeItems('Accept Invite', {
				allowEmpty: false,
			});
			expect(acceptedInviteItems[0]?.json.success).toBe(true);

			const acceptedProject = await waitForProjectAccess(inviteUserApi, projectId);
			expect(acceptedProject.id).toBe(projectId);

			const membershipsOperationResult = await context.runOperation({
				resource: 'Project',
				operation: 'List memberships',
				parameters: {
					project: {
						mode: 'id',
						value: projectId,
					},
				},
			});
			expect(membershipsOperationResult.items.length).toBeGreaterThan(0);

			const membershipId = membershipsOperationResult.items.find(
				(item) => item.json.email === inviteTarget,
			)?.json.id as string;
			expect(membershipId).toBeDefined();

			const membership = await context.runOperation({
				resource: 'Project',
				operation: 'Get Membership',
				parameters: {
					projectMembershipId: membershipId,
				},
			});

			expect(membership.firstItem.json.projectId).toBe(projectId);

			await context.runOperation({
				resource: 'Project',
				operation: 'Delete Membership',
				parameters: {
					projectMembershipId: membershipId,
				},
			});
		},
		90_000,
	);
});

async function waitForProjectAccess(
	apiClient: MittwaldApiClient,
	projectId: string,
	timeoutMs = 20_000,
	pollIntervalMs = 1500,
) {
	const deadline = Date.now() + timeoutMs;

	while (Date.now() <= deadline) {
		try {
			return await apiClient.getProject(projectId);
		} catch (error) {
			if (!(error instanceof HttpError) || ![403, 404].includes(error.statusCode)) {
				throw error;
			}
		}

		await sleep(pollIntervalMs);
	}

	throw new Error(`Timed out waiting for invited user to access project "${projectId}"`);
}
