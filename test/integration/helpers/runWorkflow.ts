import { getIntegrationEnv, type IntegrationEnv } from './env';
import {
	N8nApiClient,
	type N8nExecutionItem,
	type N8nRunResult,
	type N8nWorkflowDefinition,
	type N8nWorkflowNode,
} from './n8nClient';
import { runId } from './runMittwaldOperation';

type JsonObject = Record<string, unknown>;

export const defaultManualTriggerNodeName = 'Start Node';
export const defaultWebhookTriggerNodeName = 'Webhook Trigger';

export function createManualTriggerNode({
	name = defaultManualTriggerNodeName,
	id = 'manual-trigger',
	position = [280, 300],
}: {
	name?: string;
	id?: string;
	position?: [number, number];
} = {}): N8nWorkflowNode {
	return {
		id,
		name,
		type: 'n8n-nodes-base.manualTrigger',
		typeVersion: 1,
		position,
		parameters: {},
	};
}

export type MittwaldNodeInput = {
	name: string;
	resource: string;
	operation: string;
	parameters?: JsonObject;
	id?: string;
	position?: [number, number];
	typeVersion?: number;
};

export function createMittwaldNode(
	env: IntegrationEnv,
	{
		name,
		resource,
		operation,
		parameters = {},
		id,
		position = [560, 300],
		typeVersion = 1,
	}: MittwaldNodeInput,
): N8nWorkflowNode {
	if (!env.n8nMittwaldCredentialId) {
		throw new Error('Set N8N_MITTWALD_CREDENTIAL_ID for workflow-based tests.');
	}

	return {
		id: id ?? `mittwald-${normalizeNodeId(name) || runId('node')}`,
		name,
		type: env.n8nMittwaldNodeType,
		typeVersion,
		position,
		parameters: {
			resource,
			operation,
			...parameters,
		},
		credentials: {
			mittwaldApi: {
				name: env.n8nMittwaldCredentialName,
				id: env.n8nMittwaldCredentialId,
			},
		},
	};
}

export function createSequentialWorkflow(
	nodes: N8nWorkflowNode[],
	name?: string,
): WorkflowTestDefinition {
	if (nodes.length === 0) {
		throw new Error('At least one node is required to build a workflow.');
	}

	return {
		name,
		nodes,
		connections: buildSequentialConnections(nodes),
	};
}

export function createWorkflowBuilder({
	name,
}: {
	name?: string;
} = {}) {
	const nodes: N8nWorkflowNode[] = [];

	return {
		append(node: N8nWorkflowNode) {
			nodes.push(node);
			return this;
		},
		appendMany(newNodes: N8nWorkflowNode[]) {
			nodes.push(...newNodes);
			return this;
		},
		build(): WorkflowTestDefinition {
			return createSequentialWorkflow(nodes, name);
		},
	};
}

export type WorkflowTestDefinition = Omit<N8nWorkflowDefinition, 'name'> & {
	name?: string;
};

export interface RunWorkflowInput {
	workflow: WorkflowTestDefinition;
	triggerNodeName?: string;
	captureNodeNames?: string[];
	allowEmptyNodeNames?: string[];
	webhookPath?: string;
	httpMethod?: 'GET' | 'POST';
}

export interface RunWorkflowResult {
	workflowId: string;
	executionId: string;
	execution: JsonObject;
	itemsByNode: Record<string, N8nExecutionItem[]>;
	getNodeItems: (nodeName: string, options?: { allowEmpty?: boolean }) => N8nExecutionItem[];
	getFirstItem: (
		nodeName: string,
		options?: { allowEmpty?: boolean },
	) => N8nExecutionItem | undefined;
}

const n8nClientPromise = N8nApiClient.getInstance(getIntegrationEnv());

export async function runWorkflow({
	workflow,
	triggerNodeName = defaultManualTriggerNodeName,
	captureNodeNames = [],
	allowEmptyNodeNames = [],
	webhookPath,
	httpMethod = 'POST',
}: RunWorkflowInput): Promise<RunWorkflowResult> {
	const env = getIntegrationEnv();
	const n8nClient = await n8nClientPromise;
	const workflowDefinition: N8nWorkflowDefinition = {
		settings: {},
		...workflow,
		name: workflow.name ?? `IT workflow ${runId('workflow')}`,
	};

	const workflowId = await n8nClient.createWorkflow(workflowDefinition);

	let runResult: N8nRunResult | undefined;
	let runError: unknown;

	try {
		runResult =
			env.n8nTriggerMode === 'webhook'
				? await runWorkflowViaWebhook({
						workflowId,
						webhookPath,
						httpMethod,
						client: n8nClient,
					})
				: await n8nClient.runWorkflowViaRestRun({
						workflowId,
						triggerNodeName,
					});
	} catch (error) {
		runError = error;
	}

	let cleanupError: unknown;
	try {
		await n8nClient.deleteWorkflow(workflowId);
	} catch (error) {
		cleanupError = error;
	}

	if (runError && cleanupError) {
		throw new AggregateError(
			[toError(runError), toError(cleanupError)],
			'workflow execution failed and workflow cleanup failed',
		);
	}

	if (runError) {
		throw runError;
	}

	if (cleanupError) {
		throw cleanupError;
	}

	if (!runResult) {
		throw new Error('Workflow execution did not return a result');
	}

	const itemsByNode: Record<string, N8nExecutionItem[]> = {};
	const shouldAllowEmptyForCapture = (nodeName: string) => {
		if (allowEmptyNodeNames.length > 0) {
			return allowEmptyNodeNames.includes(nodeName);
		}
		return true;
	};

	const extractItems = (nodeName: string, allowEmpty = true) => {
		if (itemsByNode[nodeName]) {
			return itemsByNode[nodeName];
		}
		const items = n8nClient.extractNodeOutputItems(runResult.execution, nodeName);
		if (items.length === 0 && !allowEmpty) {
			throw new Error(`No output items returned for node "${nodeName}"`);
		}
		itemsByNode[nodeName] = items;
		return items;
	};

	for (const nodeName of captureNodeNames) {
		extractItems(nodeName, shouldAllowEmptyForCapture(nodeName));
	}

	return {
		workflowId,
		executionId: runResult.executionId,
		execution: runResult.execution,
		itemsByNode,
		getNodeItems: (nodeName, options) => extractItems(nodeName, options?.allowEmpty ?? true),
		getFirstItem: (nodeName, options) => {
			const items = extractItems(nodeName, options?.allowEmpty ?? true);
			return items[0];
		},
	};
}

async function runWorkflowViaWebhook({
	workflowId,
	webhookPath,
	httpMethod,
	client,
}: {
	workflowId: string;
	webhookPath?: string;
	httpMethod: 'GET' | 'POST';
	client: N8nApiClient;
}): Promise<N8nRunResult> {
	if (!webhookPath) {
		throw new Error(
			'Webhook trigger mode requires a webhookPath. Provide it in runWorkflow({ webhookPath }).',
		);
	}

	return client.runWorkflowViaWebhook({ workflowId, webhookPath, httpMethod });
}

function toError(value: unknown): Error {
	if (value instanceof Error) {
		return value;
	}

	return new Error(String(value));
}

function buildSequentialConnections(nodes: N8nWorkflowNode[]): JsonObject {
	const connections: Record<string, unknown> = {};

	for (let i = 0; i < nodes.length - 1; i += 1) {
		const fromNode = nodes[i];
		const toNode = nodes[i + 1];
		if (!fromNode || !toNode) {
			continue;
		}
		connections[fromNode.name] = {
			main: [
				[
					{
						node: toNode.name,
						type: 'main',
						index: 0,
					},
				],
			],
		};
	}

	return connections;
}

function normalizeNodeId(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}
