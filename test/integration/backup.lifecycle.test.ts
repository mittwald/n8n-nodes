/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

type BackupApi = {
	backup: {
		deleteProjectBackup: (input: { projectBackupId: string }) => Promise<unknown>;
		deleteProjectBackupExport: (input: { projectBackupId: string }) => Promise<unknown>;
	};
	project: {
		deleteProject: (input: { projectId: string }) => Promise<unknown>;
	};
};

integrationDescribe('Backup / Lifecycle (integration)', () => {
	testcase(
		'creates, lists, gets, and exports a project backup in one workflow',
		async (context) => {
			const description = `it-${runId('backup-flow')}`;
			const expirationTime = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();
			const backupApi = context.mittwaldApi as unknown as BackupApi;
			const cleanup = {
				projectId: undefined as string | undefined,
				backupId: undefined as string | undefined,
			};

			context.teardown(async () => {
				if (cleanup.backupId) {
					await backupApi.backup.deleteProjectBackupExport({
						projectBackupId: cleanup.backupId,
					});
					await backupApi.backup.deleteProjectBackup({ projectBackupId: cleanup.backupId });
				}

				if (cleanup.projectId) {
					await backupApi.project.deleteProject({ projectId: cleanup.projectId });
				}
			});

			const createResult = await context
				.scenario('Backup lifecycle setup')
				.step({
					name: 'Create Project',
					resource: 'Project',
					operation: 'Create',
					parameters: {
						server: {
							mode: 'id',
							value: context.env.testServerId,
						},
						description,
					},
				})
				.step({
					name: 'Create Backup',
					resource: 'Backup',
					operation: 'Create',
					parameters: {
						project: fromStep('Create Project'),
						description,
						expirationTime,
					},
				})
				.run();

			const projectId = createResult.step('Create Project').requireString('id');
			const backupId = createResult.step('Create Backup').requireString('id');
			cleanup.projectId = projectId;
			cleanup.backupId = backupId;

			const result = await context
				.scenario('Backup lifecycle')
				.step({
					name: 'List Backups',
					resource: 'Backup',
					operation: 'List',
					parameters: {
						project: {
							mode: 'id',
							value: projectId,
						},
					},
				})
				.step({
					name: 'Get Backup',
					resource: 'Backup',
					operation: 'Get',
					parameters: {
						backupId,
					},
				})
				.step({
					name: 'Create Export',
					resource: 'Backup',
					operation: 'Create Export',
					parameters: {
						backupId,
						format: 'tar',
					},
				})
				.run();

			expect(result.step('List Backups').stringValues('id')).toContain(backupId);
			expect(result.step('Get Backup').requireString('id')).toBe(backupId);
		},
		120_000,
	);
});
