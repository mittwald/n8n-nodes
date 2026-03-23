/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import { hasIntegrationEnv } from './helpers';
import {
	createManualTriggerNode,
	createMittwaldNode,
	createSequentialWorkflow,
} from './helpers';
import { readRequiredString, testcase } from './testcase';

const integrationDescribe = hasIntegrationEnv() ? describe : describe.skip;

integrationDescribe('Workflow / Multi-Node (example)', () => {
	testcase(
		'creates a project and then lists SSH users in the same workflow',
		async (context) => {
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
					description: `it-${Date.now()}-workflow-project`,
				},
			});

			const listSshUsersNode = createMittwaldNode(context.env, {
				name: 'List SSH Users',
				resource: 'Project',
				operation: 'List SSH Users',
				parameters: {
					project: {
						mode: 'id',
						value: '={{ $node["Create Project"].json["id"] }}',
					},
				},
			});

			const result = await context.runWorkflow({
				workflow: createSequentialWorkflow([trigger, createProjectNode, listSshUsersNode]),
			});

			const createItems = result.getNodeItems(createProjectNode.name, { allowEmpty: false });
			const projectId = readRequiredString(createItems[0]?.json ?? {}, 'id');

			context.teardown(async () => {
				await context.mittwaldApi.deleteProject(projectId);
			});

			const listItems = result.getNodeItems(listSshUsersNode.name);
			expect(Array.isArray(listItems)).toBe(true);
		},
		30_000,
	);
});
