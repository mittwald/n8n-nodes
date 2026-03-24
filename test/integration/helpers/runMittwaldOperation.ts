import { getIntegrationEnv } from './env';
import {
	N8nApiClient,
	type N8nExecutionItem,
	type N8nWorkflowDefinition,
	type N8nWorkflowNode,
} from './n8nClient';

type JsonObject = Record<string, unknown>;

export interface RunMittwaldOperationInput {
	resource: string;
	operation: string;
	parameters?: JsonObject;
	allowEmptyItems?: boolean;
}

export interface RunMittwaldOperationResult {
	workflowId: string;
	executionId: string;
	items: N8nExecutionItem[];
	firstItem: N8nExecutionItem;
}

const manualTriggerNodeName = 'Start Node';
const mittwaldNodeName = 'mittwald';
const mittwaldCredentialType = 'mittwaldApi';

let cachedCredentialId: string | undefined;
let n8nClientPromise: Promise<N8nApiClient> | undefined;

export async function runMittwaldOperation({
	resource,
	operation,
	parameters = {},
	allowEmptyItems = false,
}: RunMittwaldOperationInput): Promise<RunMittwaldOperationResult> {
	const env = getIntegrationEnv();
	const n8nClient = await getN8nClient();
	const credentialId = await resolveMittwaldCredentialId(n8nClient, env);
	const triggerNodeName = manualTriggerNodeName;
	const triggerNode: N8nWorkflowNode = {
		id: 'manual-trigger',
		name: triggerNodeName,
		type: 'n8n-nodes-base.manualTrigger',
		typeVersion: 1,
		position: [280, 300],
		parameters: {},
	};

	const workflowDefinition: N8nWorkflowDefinition = {
		name: `IT ${resource}/${operation} ${runId()}`,
		nodes: [
			triggerNode,
			{
				id: 'mittwald-node',
				name: mittwaldNodeName,
				type: env.n8nMittwaldNodeType,
				typeVersion: 1,
				position: [560, 300],
				parameters: {
					resource,
					operation,
					...parameters,
				},
				credentials: {
					mittwaldApi: {
						id: credentialId,
						name: env.n8nMittwaldCredentialName,
					},
				},
			},
		],
		connections: {
			[triggerNodeName]: {
				main: [
					[
						{
							node: mittwaldNodeName,
							type: 'main',
							index: 0,
						},
					],
				],
			},
		},
		settings: {},
	};

	const workflowId = await n8nClient.createWorkflow(workflowDefinition);

	let executionId = '';
	let items: N8nExecutionItem[] = [];
	let runError: unknown;

	try {
		const runResult = await n8nClient.runWorkflowViaRestRun({
			workflowId,
			triggerNodeName: manualTriggerNodeName,
		});
		executionId = runResult.executionId;
		items = n8nClient.extractNodeOutputItems(runResult.execution, mittwaldNodeName);
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
			'mittwald operation failed and workflow cleanup failed',
		);
	}

	if (runError) {
		throw runError;
	}

	if (cleanupError) {
		throw cleanupError;
	}

	const firstItem = items[0];
	if (!firstItem) {
		if (allowEmptyItems) {
			return {
				workflowId,
				executionId,
				items,
				firstItem: { json: {} },
			};
		}
		throw new Error(`No output item returned for ${resource}/${operation}`);
	}

	return {
		workflowId,
		executionId,
		items,
		firstItem,
	};
}

export function runId(prefix = 'it'): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function resolveMittwaldCredentialId(
	n8nClient: N8nApiClient,
	env: ReturnType<typeof getIntegrationEnv>,
): Promise<string> {
	if (cachedCredentialId) {
		return cachedCredentialId;
	}

	const credentials = await n8nClient.listCredentials();
	if (env.n8nMittwaldCredentialId) {
		const byId = credentials.find((credential) => credential.id === env.n8nMittwaldCredentialId);
		if (byId) {
			cachedCredentialId = byId.id;
			return byId.id;
		}
	}

	const existing = credentials.find(
		(credential) =>
			credential.name === env.n8nMittwaldCredentialName &&
			credential.type === mittwaldCredentialType,
	);
	if (existing) {
		cachedCredentialId = existing.id;
		return existing.id;
	}

	const created = await n8nClient.createCredential({
		name: env.n8nMittwaldCredentialName,
		type: mittwaldCredentialType,
		data: {
			apiKey: env.mittwaldApiToken,
			allowedDomains: 'All',
		},
	});
	cachedCredentialId = created.id;
	return created.id;
}

function toError(value: unknown): Error {
	if (value instanceof Error) {
		return value;
	}

	return new Error(String(value));
}

function getN8nClient(): Promise<N8nApiClient> {
	if (!n8nClientPromise) {
		n8nClientPromise = N8nApiClient.getInstance(getIntegrationEnv());
	}

	return n8nClientPromise;
}
