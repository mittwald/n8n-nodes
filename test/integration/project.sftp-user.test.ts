/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import { hasIntegrationEnv, runId } from './helpers';
import { sleep } from './helpers/runtime';
import { readRequiredString, testcase } from './testcase';

type ExecutionItem = { json: Record<string, unknown> };

type WaitForRemovalInput = {
	context: {
		runOperation: (input: {
			resource: string;
			operation: string;
			parameters?: Record<string, unknown>;
		}) => Promise<{ items: ExecutionItem[] }>;
	};
	projectId: string;
	sftpUserId: string;
	timeoutMs?: number;
	pollIntervalMs?: number;
};

const integrationDescribe = hasIntegrationEnv() ? describe : describe.skip;

integrationDescribe('Project / SFTP User (integration)', () => {
	testcase(
		'creates and deletes an SFTP user',
		async (context) => {
			const projectDescription = `it-${runId('sftp-project')}`;
			const userDescription = `it-${runId('sftp-user')}`;
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

			let sftpUserId: string | undefined;
			let sftpUserDeleted = false;
			context.teardown(async () => {
				if (!sftpUserId || sftpUserDeleted) {
					return;
				}
				await context.runOperation({
					resource: 'Project',
					operation: 'Delete SFTP User',
					parameters: {
						sftpUserId,
					},
				});
			});

			const createdUser = await context.runOperation({
				resource: 'Project',
				operation: 'Create SFTP User',
				parameters: {
					project: {
						mode: 'id',
						value: projectId,
					},
					description: userDescription,
					password,
					accessLevel: 'read',
					directories: '/html',
				},
			});

			sftpUserId = readRequiredString(createdUser.firstItem.json, 'id');
			expect(readRequiredString(createdUser.firstItem.json, 'projectId')).toBe(projectId);

			const listedUsers = await context.runOperation({
				resource: 'Project',
				operation: 'List SFTP Users',
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
			expect(listedIds).toContain(sftpUserId);

			await context.runOperation({
				resource: 'Project',
				operation: 'Delete SFTP User',
				parameters: {
					sftpUserId,
				},
			});
			sftpUserDeleted = true;

			await waitForSftpUserRemoval({
				context,
				projectId,
				sftpUserId,
			});
		},
		30_000,
	);
});

async function waitForSftpUserRemoval({
	context,
	projectId,
	sftpUserId,
	timeoutMs = 20_000,
	pollIntervalMs = 1500,
}: WaitForRemovalInput): Promise<void> {
	const deadline = Date.now() + timeoutMs;

	while (Date.now() <= deadline) {
		const listedUsers = await context.runOperation({
			resource: 'Project',
			operation: 'List SFTP Users',
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

		if (!listedIds.includes(sftpUserId)) {
			return;
		}

		await sleep(pollIntervalMs);
	}

	throw new Error(`Timed out waiting for SFTP user "${sftpUserId}" to be removed`);
}

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
	const value = source[key];
	return typeof value === 'string' ? value : undefined;
}
