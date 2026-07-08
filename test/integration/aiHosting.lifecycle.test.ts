/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('AI Hosting / Lifecycle (integration)', () => {
	testcase(
		'gets project usage and manages a project key',
		async (context) => {
			const projectDescription = `it-${runId('ai-hosting-project')}`;
			const keyName = `it-${runId('ai-key')}`;

			context.teardown(async () => {
				const response = await context.mittwaldApi.project.listProjects();

				if (response.status !== 200) {
					throw new Error(`Failed to list projects during teardown: ${response.statusText}`);
				}

				const project = response.data.find(
					(entry: { description?: string }) => entry.description === projectDescription,
				);
				if (project) {
					await context.mittwaldApi.project.deleteProject({ projectId: project.id });
				}
			});

			const result = await context
				.scenario('AI hosting project key lifecycle')
				.step({
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
				})
				.step({
					name: 'Get Project Usage Before',
					resource: 'AI Hosting',
					operation: 'Get Project Usage',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.step({
					name: 'Create Project Key',
					resource: 'AI Hosting',
					operation: 'Create Project Key',
					parameters: {
						project: fromStep('Create Project'),
						keyName,
						createWebuiContainer: false,
					},
				})
				.step({
					name: 'Get Project Usage After',
					resource: 'AI Hosting',
					operation: 'Get Project Usage',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.step({
					name: 'Delete Project Key',
					resource: 'AI Hosting',
					operation: 'Delete Project Key',
					parameters: {
						project: fromStep('Create Project'),
						keyId: fromStep('Create Project Key', 'keyId'),
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

			expect(result.step('Get Project Usage Before').first()?.json).toMatchObject({
				projectId,
				keys: expect.any(Object),
			});
			expect(result.step('Create Project Key').requireString('keyId')).not.toHaveLength(0);
			expect(result.step('Create Project Key').requireString('name')).toBe(keyName);
			expect(result.step('Get Project Usage After').first()?.json).toMatchObject({
				projectId,
				keys: expect.any(Object),
			});
		},
		10_000,
	);
});
