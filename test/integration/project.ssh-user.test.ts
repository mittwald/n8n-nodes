/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { runId, runMittwaldOperation } from './helpers';
import { sleep } from './helpers/runtime';
import { integrationDescribe, readOptionalString, readRequiredString, testcase } from './testcase';

type WaitForRemovalInput = {
	context: {
		runOperation: typeof runMittwaldOperation;
	};
	projectId: string;
	sshUserId: string;
	timeoutMs?: number;
	pollIntervalMs?: number;
};

integrationDescribe('Project / SSH User (integration)', () => {
	testcase(
		'creates and deletes an SSH user',
		async (context) => {
			const projectDescription = `it-${runId('ssh-project')}`;
			const userDescription = `it-${runId('ssh-user')}`;
			const password = `S3cure!${runId('pw')}`;

			const createdProject = await context.runOperation({
				resource: 'Project',
				operation: 'Create',
				parameters: {
					server: {
						mode: 'id',
						value: context.env.testServerId,
					},
					description: projectDescription,
				},
			});

			const projectId = readRequiredString(createdProject.firstItem.json, 'id');
			context.teardown(async () => {
				await context.mittwaldApi.deleteProject(projectId);
			});

			let sshUserId: string | undefined;
			let sshUserDeleted = false;
			context.teardown(async () => {
				if (!sshUserId || sshUserDeleted) {
					return;
				}
				await context.runOperation({
					resource: 'Project',
					operation: 'Delete SSH User',
					parameters: {
						sshUserId,
					},
				});
			});

			const createdUser = await context.runOperation({
				resource: 'Project',
				operation: 'Create SSH User',
				parameters: {
					project: {
						mode: 'id',
						value: projectId,
					},
					description: userDescription,
					password,
				},
			});

			sshUserId = readRequiredString(createdUser.firstItem.json, 'id');
			expect(readRequiredString(createdUser.firstItem.json, 'projectId')).toBe(projectId);

			const listedUsers = await context.runOperation({
				resource: 'Project',
				operation: 'List SSH Users',
				parameters: {
					project: {
						mode: 'id',
						value: projectId,
					},
				},
				allowEmptyItems: true,
			});

			const listedIds = listedUsers.items
				.map((item) => readOptionalString(item.json, 'id'))
				.filter((value): value is string => Boolean(value));
			expect(listedIds).toContain(sshUserId);

			await context.runOperation({
				resource: 'Project',
				operation: 'Delete SSH User',
				parameters: {
					sshUserId,
				},
			});
			sshUserDeleted = true;

			await waitForSshUserRemoval({
				context,
				projectId,
				sshUserId,
			});
		},
		30_000,
	);
});

async function waitForSshUserRemoval({
	context,
	projectId,
	sshUserId,
	timeoutMs = 20_000,
	pollIntervalMs = 1500,
}: WaitForRemovalInput): Promise<void> {
	const deadline = Date.now() + timeoutMs;

	while (Date.now() <= deadline) {
		const listedUsers = await context.runOperation({
			resource: 'Project',
			operation: 'List SSH Users',
			parameters: {
				project: {
					mode: 'id',
					value: projectId,
				},
			},
			allowEmptyItems: true,
		});

		const listedIds = listedUsers.items
			.map((item) => readOptionalString(item.json, 'id'))
			.filter((value): value is string => Boolean(value));

		if (!listedIds.includes(sshUserId)) {
			return;
		}

		await sleep(pollIntervalMs);
	}

	throw new Error(`Timed out waiting for SSH user "${sshUserId}" to be removed`);
}
