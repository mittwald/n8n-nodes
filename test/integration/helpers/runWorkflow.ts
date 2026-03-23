import { getIntegrationEnv, type IntegrationEnv } from './env';
import {
	N8nApiClient,
	type N8nCredentialReference,
	type N8nExecutionItem,
	type N8nRunResult,
	type N8nWorkflowDefinition,
	type N8nWorkflowNode,
} from './n8nClient';
import { runId } from './runMittwaldOperation';

type JsonObject = Record<string, unknown>;

export const defaultManualTriggerNodeName = 'Start Node';

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
	credential?: N8nCredentialReference;
	id?: string;
	position?: [number, number];
	typeVersion?: number;
};

export type NodeReference = {
	mode: 'id';
	value: string;
};

export function createMittwaldNode(
	env: IntegrationEnv,
	{
		name,
		resource,
		operation,
		parameters = {},
		credential,
		id,
		position = [560, 300],
		typeVersion = 1,
	}: MittwaldNodeInput,
): N8nWorkflowNode {
	if (!credential && !env.n8nMittwaldCredentialId) {
		throw new Error('Set N8N_MITTWALD_CREDENTIAL_ID for workflow-based tests.');
	}

	const credentialReference = credential ?? {
		name: env.n8nMittwaldCredentialName,
		id: env.n8nMittwaldCredentialId as string,
	};

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
			mittwaldApi: credentialReference,
		},
	};
}

export function createMittwaldWorkflow(
	env: IntegrationEnv,
	steps: MittwaldNodeInput[],
	name?: string,
): WorkflowTestDefinition {
	return createSequentialWorkflow(
		[createManualTriggerNode(), ...steps.map((step) => createMittwaldNode(env, step))],
		name,
	);
}

export function nodeJsonExpression(nodeName: string, field = 'id'): string {
	return `={{ $items("${nodeName}")[0].json["${field}"] }}`;
}

export function nodeIdReference(nodeName: string, field = 'id'): NodeReference {
	return {
		mode: 'id',
		value: nodeJsonExpression(nodeName, field),
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

export type WorkflowTestDefinition = Omit<N8nWorkflowDefinition, 'name'> & {
	name?: string;
};

export interface RunWorkflowInput {
	workflow: WorkflowTestDefinition;
	triggerNodeName?: string;
	captureNodeNames?: string[];
	allowEmptyNodeNames?: string[];
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
}: RunWorkflowInput): Promise<RunWorkflowResult> {
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
		runResult = await n8nClient.runWorkflowViaRestRun({
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
