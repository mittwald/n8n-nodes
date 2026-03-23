/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { createMittwaldWorkflow, nodeIdReference, runId } from './helpers';
import {
	integrationDescribe,
	readOptionalString,
	readRequiredString,
	testcase,
} from './testcase';

integrationDescribe('Project / Lifecycle (integration)', () => {
	testcase('creates, lists, gets, and deletes a project in one workflow', async (context) => {
		const description = `it-${runId('project-flow')}`;

		context.teardown(async () => {
			const projects = await context.mittwaldApi.listProjects();
			const project = projects.find((entry) => entry.description === description);
			if (project) {
				await context.mittwaldApi.deleteProject(project.id);
			}
		});

		const createProjectStep = {
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
		} as const;
		const listProjectsStep = {
			name: 'List Projects',
			resource: 'Project',
			operation: 'List',
		} as const;
		const getProjectStep = {
			name: 'Get Project',
			resource: 'Project',
			operation: 'Get',
			parameters: {
				project: nodeIdReference(createProjectStep.name),
			},
		} as const;
		const deleteProjectStep = {
			name: 'Delete Project',
			resource: 'Project',
			operation: 'Delete',
			parameters: {
				project: nodeIdReference(createProjectStep.name),
			},
		} as const;

		const result = await context.runWorkflow({
			workflow: createMittwaldWorkflow(context.env, [
				createProjectStep,
				listProjectsStep,
				getProjectStep,
				deleteProjectStep,
			]),
		});

		const createdProject = result.getFirstItem(createProjectStep.name, { allowEmpty: false });
		const projectId = readRequiredString(createdProject?.json ?? {}, 'id');

		const listedProjectIds = result
			.getNodeItems(listProjectsStep.name, { allowEmpty: false })
			.map((item) => readOptionalString(item.json, 'id'))
			.filter((value): value is string => Boolean(value));
		expect(listedProjectIds).toContain(projectId);

		const fetchedProject = result.getFirstItem(getProjectStep.name, { allowEmpty: false });
		expect(readRequiredString(fetchedProject?.json ?? {}, 'id')).toBe(projectId);
		expect(readRequiredString(fetchedProject?.json ?? {}, 'description')).toBe(description);

		await expectProjectToBeInaccessible(context, projectId);
	});
});

async function expectProjectToBeInaccessible(
	context: {
		mittwaldApi: {
			getProject: (projectId: string) => Promise<unknown>;
		};
	},
	projectId: string,
): Promise<void> {
	try {
		await context.mittwaldApi.getProject(projectId);
	} catch (error) {
		const statusCode = (error as { statusCode?: unknown }).statusCode;
		if (statusCode === 403 || statusCode === 404) {
			return;
		}
		throw error;
	}

	throw new Error(`Expected deleted project "${projectId}" to be inaccessible`);
}
