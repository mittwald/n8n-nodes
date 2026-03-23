/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import {
	createManualTriggerNode,
	createMittwaldNode,
	createSequentialWorkflow,
	hasIntegrationEnv,
	runId,
} from './helpers';
import { readRequiredString, testcase } from './testcase';

const integrationDescribe = hasIntegrationEnv() ? describe : describe.skip;

integrationDescribe('Project / Get (integration)', () => {
	testcase('creates a project and fetches it via Get', async (context) => {
		const description = `it-${runId('project-get')}`;

		const trigger = createManualTriggerNode();
		const createProjectNode = createMittwaldNode(context.env, {
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
		});
		const getProjectNode = createMittwaldNode(context.env, {
			name: 'Get Project',
			resource: 'Project',
			operation: 'Get',
			parameters: {
				project: {
					mode: 'id',
					value: '={{ $node["Create Project"].json["id"] }}',
				},
			},
		});

		const result = await context.runWorkflow({
			workflow: createSequentialWorkflow([trigger, createProjectNode, getProjectNode]),
		});

		const createdItems = result.getNodeItems(createProjectNode.name, { allowEmpty: false });
		const projectId = readRequiredString(createdItems[0]?.json ?? {}, 'id');
		context.teardown(async () => {
			await context.mittwaldApi.deleteProject(projectId);
		});

		const fetchedItems = result.getNodeItems(getProjectNode.name, { allowEmpty: false });
		expect(readRequiredString(fetchedItems[0]?.json ?? {}, 'id')).toBe(projectId);
	});
});
