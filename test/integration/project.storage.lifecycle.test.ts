/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Project / Storage (integration)', () => {
	testcase(
		'reads storage statistics and updates the notification threshold',
		async (context) => {
			const description = `it-${runId('project-storage')}`;
			const newThresholdInBytes = 5 * 1024 * 1024 * 1024; // 5 GiB

			context.teardown(async () => {
				const response = await context.mittwaldApi.project.listProjects();

				if (response.status !== 200) {
					throw new Error(`Failed to list projects during teardown: ${response.statusText}`);
				}

				const projects = response.data;

				const project = projects.find((entry) => entry.description === description);
				if (project) {
					await context.mittwaldApi.project.deleteProject({ projectId: project.id });
				}
			});

			const result = await context
				.scenario('Project storage lifecycle')
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
					name: 'Get Storage Statistics',
					resource: 'Project',
					operation: 'Get Storage Statistics',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.step({
					name: 'Update Storage Notification Threshold',
					resource: 'Project',
					operation: 'Update Storage Notification Threshold',
					parameters: {
						project: fromStep('Create Project'),
						notificationThresholdInBytes: newThresholdInBytes,
					},
				})
				.step({
					name: 'Read Storage Statistics After Update',
					resource: 'Project',
					operation: 'Get Storage Statistics',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.step({
					name: 'Delete Project',
					resource: 'Project',
					operation: 'Delete',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.run();

			const projectId = result.step('Create Project').requireString('id');
			const updatedStorageStatistics = result.step('Read Storage Statistics After Update').first();

			expect(result.step('Get Storage Statistics').requireString('id')).toBe(projectId);
			expect(result.step('Get Storage Statistics').requireString('kind')).toBe('project');
			expect(updatedStorageStatistics?.json.notificationThresholdInBytes).toBe(
				newThresholdInBytes,
			);
		},
		30_000,
	);
});
