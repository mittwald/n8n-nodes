import type { IntegrationEnv } from './env';
import { HttpError, requestJson } from './http';
import { base64Encode, createUrl, runtimeFetch, sleep } from './runtime';

type JsonObject = Record<string, unknown>;
type JsonArray = unknown[];

export interface N8nCredentialReference {
	id: string;
	name: string;
}

export interface N8nWorkflowNode {
	id: string;
	name: string;
	type: string;
	typeVersion: number;
	position: [number, number];
	parameters: JsonObject;
	credentials?: Record<string, N8nCredentialReference>;
}

export interface N8nWorkflowDefinition {
	name: string;
	nodes: N8nWorkflowNode[];
	connections: JsonObject;
	settings?: JsonObject;
	active?: boolean;
}

export interface N8nCredentialSummary {
	id: string;
	name: string;
	type: string;
}

export interface N8nExecutionItem extends JsonObject {
	json: JsonObject;
}

export interface N8nExecutionSummary {
	id: string;
	workflowId: string | undefined;
}

export interface N8nRunResult {
	executionId: string;
	execution: JsonObject;
}

export class N8nApiClient {
	private readonly n8nBaseUrl: string;
	private readonly n8nApiKey: string;
	private readonly n8nApiBasePath: string;
	private readonly n8nRestBasePath: string;
	private readonly n8nWebhookBasePath: string;
	private readonly n8nBasicAuthHeader?: string;
	private readonly n8nRunTimeoutMs: number;
	private readonly n8nPollIntervalMs: number;
	private readonly n8nRestLoginEmail?: string;
	private readonly n8nRestLoginPassword?: string;
	private restCookie?: string;
	private restLoginPromise?: Promise<void>;

	private static instance?: N8nApiClient;

	public constructor(env: IntegrationEnv) {
		this.n8nBaseUrl = env.n8nBaseUrl;
		this.n8nApiKey = env.n8nApiKey;
		this.n8nApiBasePath = trimTrailingSlash(env.n8nApiBasePath);
		this.n8nRestBasePath = trimTrailingSlash(env.n8nRestBasePath);
		this.n8nWebhookBasePath = trimTrailingSlash(env.n8nWebhookBasePath);
		this.n8nBasicAuthHeader = buildBasicAuthHeader(env.n8nBasicAuthUser, env.n8nBasicAuthPassword);
		this.n8nRunTimeoutMs = env.n8nRunTimeoutMs;
		this.n8nPollIntervalMs = env.n8nPollIntervalMs;
		this.n8nRestLoginEmail = env.n8nRestLoginEmail;
		this.n8nRestLoginPassword = env.n8nRestLoginPassword;
	}

	public static async getInstance(env: IntegrationEnv): Promise<N8nApiClient> {
		if (!N8nApiClient.instance) {
			N8nApiClient.instance = new N8nApiClient(env);
		}

		await N8nApiClient.instance.ensureRestLogin();
		return N8nApiClient.instance;
	}

	public async createWorkflow(definition: N8nWorkflowDefinition): Promise<string> {
		const payload = await this.request({
			path: '/workflows',
			method: 'POST',
			body: definition,
			expectedStatusCodes: [200, 201],
		});

		const workflowRecord = toRecord(unwrapData(payload));
		const workflowId = extractString(workflowRecord, 'id');
		if (!workflowId) {
			throw new Error('n8n did not return a workflow id');
		}

		return workflowId;
	}

	public async deleteWorkflow(workflowId: string): Promise<void> {
		await this.request({
			path: `/workflows/${workflowId}`,
			method: 'DELETE',
			expectedStatusCodes: [200, 202, 204],
		});
	}

	public async activateWorkflow(workflowId: string): Promise<void> {
		try {
			await this.request({
				path: `/workflows/${workflowId}/activate`,
				method: 'POST',
				expectedStatusCodes: [200, 204],
			});
		} catch (error) {
			if (error instanceof HttpError && error.statusCode === 404) {
				await this.requestRest({
					path: `/workflows/${workflowId}/activate`,
					method: 'POST',
					expectedStatusCodes: [200, 204],
				});
				return;
			}
			throw error;
		}
	}

	public async deactivateWorkflow(workflowId: string): Promise<void> {
		try {
			await this.request({
				path: `/workflows/${workflowId}/deactivate`,
				method: 'POST',
				expectedStatusCodes: [200, 204],
			});
		} catch (error) {
			if (error instanceof HttpError && error.statusCode === 404) {
				await this.requestRest({
					path: `/workflows/${workflowId}/deactivate`,
					method: 'POST',
					expectedStatusCodes: [200, 204],
				});
				return;
			}
			throw error;
		}
	}

	public async runWorkflow(workflowId: string): Promise<N8nRunResult> {
		const runPayload = await this.startWorkflowRun(workflowId);
		const directExecution = tryGetExecution(runPayload);
		if (directExecution && this.isExecutionFinished(directExecution)) {
			const directExecutionId = extractString(directExecution, 'id') ?? workflowId;
			return { executionId: directExecutionId, execution: directExecution };
		}

		const executionId = extractExecutionId(runPayload);
		if (!executionId) {
			throw new Error('n8n did not return an execution id');
		}

		const execution = await this.waitForExecution(executionId);
		return { executionId, execution };
	}

	public async runWorkflowViaWebhook({
		workflowId,
		webhookPath,
		httpMethod = 'POST',
	}: {
		workflowId: string;
		webhookPath: string;
		httpMethod?: 'GET' | 'POST';
	}): Promise<N8nRunResult> {
		const existingExecutions = await this.listExecutions({ workflowId, limit: 10 });
		const existingIds = new Set(existingExecutions.map((execution) => execution.id));

		await this.activateWorkflow(workflowId);
		await this.triggerWebhook(webhookPath, httpMethod);

		const executionId = await this.waitForNewExecution(workflowId, existingIds);
		const execution = await this.waitForExecution(executionId);
		return { executionId, execution };
	}

	public async runWorkflowViaRestRun({
		workflowId,
		triggerNodeName = 'Start Node',
	}: {
		workflowId: string;
		triggerNodeName?: string;
	}): Promise<N8nRunResult> {
		const existingExecutions = await this.listExecutions({ workflowId, limit: 10 });
		const existingIds = new Set(existingExecutions.map((execution) => execution.id));

		await this.requestRest({
			path: `/workflows/${workflowId}/run`,
			method: 'POST',
			expectedStatusCodes: [200, 201, 202],
			body: {
				workflowId,
				startNodes: [],
				triggerToStartFrom: {
					name: triggerNodeName,
				},
			},
		});

		const executionId = await this.waitForNewExecution(workflowId, existingIds);
		const execution = await this.waitForExecution(executionId);
		return { executionId, execution };
	}

	public async listCredentials(): Promise<N8nCredentialSummary[]> {
		const payload = await this.request({
			path: '/credentials',
			method: 'GET',
		});

		const data = unwrapData(payload);
		if (!Array.isArray(data)) {
			throw new Error('n8n credentials list response is not an array');
		}

		return data
			.map((entry) => {
				const record = asRecord(entry);
				if (!record) {
					return undefined;
				}
				const id = extractString(record, 'id');
				const name = extractString(record, 'name');
				const type = extractString(record, 'type');
				if (!id || !name || !type) {
					return undefined;
				}
				return { id, name, type };
			})
			.filter((entry): entry is N8nCredentialSummary => Boolean(entry));
	}

	public async createCredential({
		name,
		type,
		data,
	}: {
		name: string;
		type: string;
		data: JsonObject;
	}): Promise<N8nCredentialSummary> {
		const payload = await this.request({
			path: '/credentials',
			method: 'POST',
			body: {
				name,
				type,
				data,
			},
			expectedStatusCodes: [200, 201],
		});

		const record = toRecord(unwrapData(payload));
		const id = extractString(record, 'id');
		const createdName = extractString(record, 'name') ?? name;
		const createdType = extractString(record, 'type') ?? type;
		if (!id) {
			throw new Error('n8n did not return a credential id');
		}

		return { id, name: createdName, type: createdType };
	}

	public async listExecutions({
		workflowId,
		limit = 10,
	}: {
		workflowId?: string;
		limit?: number;
	}): Promise<N8nExecutionSummary[]> {
		const payload = await this.request({
			path: '/executions',
			method: 'GET',
			query: {
				workflowId,
				limit,
			},
		});

		const data = unwrapData(payload);
		const list =
			extractArray(data) ??
			extractArray(asRecord(data)?.data) ??
			extractArray(asRecord(data)?.results) ??
			[];

		return list
			.map((entry) => {
				const record = asRecord(entry);
				if (!record) {
					return undefined;
				}
				const id = extractString(record, 'id');
				if (!id) {
					return undefined;
				}
				const workflowIdValue = extractString(record, 'workflowId');
				return { id, workflowId: workflowIdValue };
			})
			.filter((entry): entry is N8nExecutionSummary => Boolean(entry));
	}

	public extractNodeOutputItems(execution: JsonObject, nodeName: string): N8nExecutionItem[] {
		const runData = this.extractRunData(execution);
		const nodeRuns = runData[nodeName];
		if (!Array.isArray(nodeRuns) || nodeRuns.length === 0) {
			throw new Error(`No execution data found for node "${nodeName}"`);
		}

		const lastRun = nodeRuns[nodeRuns.length - 1];
		const runRecord = toRecord(lastRun);
		const runError = asRecord(runRecord.error);
		if (runError) {
			throw buildNodeExecutionError(nodeName, runError);
		}

		const runDataRecord = asRecord(runRecord.data);
		if (!runDataRecord) {
			throw new Error(`Node "${nodeName}" finished without output data`);
		}
		const mainOutput = runDataRecord.main;
		if (!Array.isArray(mainOutput) || mainOutput.length === 0) {
			throw new Error(`Execution output for node "${nodeName}" does not contain main data`);
		}

		const firstOutputBranch = mainOutput[0];
		if (!Array.isArray(firstOutputBranch)) {
			throw new Error(`Execution output for node "${nodeName}" has invalid branch data`);
		}

		return firstOutputBranch.map((item, index) => {
			const itemRecord = toRecord(item);
			const json = toRecord(itemRecord.json);
			return {
				...itemRecord,
				json,
				index,
			};
		});
	}

	private async startWorkflowRun(workflowId: string): Promise<unknown> {
		try {
			return await this.request({
				path: `/workflows/${workflowId}/run`,
				method: 'POST',
				query: {
					waitTillComplete: true,
				},
			});
		} catch (error) {
			if (error instanceof HttpError) {
				if (error.statusCode === 404) {
					return await this.startWorkflowRunViaRest(workflowId);
				}
				if (error.statusCode === 400) {
					return await this.request({
						path: `/workflows/${workflowId}/run`,
						method: 'POST',
					});
				}
			}

			throw error;
		}
	}

	private async startWorkflowRunViaRest(workflowId: string): Promise<unknown> {
		if (!this.n8nBasicAuthHeader) {
			throw new Error(
				'n8n REST API requires Basic Auth. Set N8N_BASIC_AUTH_USER and N8N_BASIC_AUTH_PASSWORD.',
			);
		}

		return await this.requestRest({
			path: `/workflows/${workflowId}/run`,
			method: 'POST',
		});
	}

	private async triggerWebhook(path: string, method: 'GET' | 'POST'): Promise<void> {
		const headers: Record<string, string> = {};
		if (this.n8nBasicAuthHeader) {
			headers.Authorization = this.n8nBasicAuthHeader;
		}

		await requestJson({
			baseUrl: this.n8nBaseUrl,
			path: joinPath(this.n8nWebhookBasePath, path),
			method,
			headers,
			expectedStatusCodes: [200, 201, 202, 204],
		});
	}

	private async waitForNewExecution(workflowId: string, existingIds: Set<string>): Promise<string> {
		const deadline = Date.now() + this.n8nRunTimeoutMs;

		while (Date.now() <= deadline) {
			const executions = await this.listExecutions({ workflowId, limit: 10 });
			const newExecution = executions.find((execution) => !existingIds.has(execution.id));
			if (newExecution) {
				return newExecution.id;
			}
			await sleep(this.n8nPollIntervalMs);
		}

		throw new Error(`No new execution found for workflow ${workflowId}`);
	}

	private async waitForExecution(executionId: string): Promise<JsonObject> {
		const deadline = Date.now() + this.n8nRunTimeoutMs;

		while (Date.now() <= deadline) {
			let execution: JsonObject | undefined;
			try {
				execution = await this.getExecution(executionId);
			} catch (error) {
				if (!(error instanceof HttpError) || error.statusCode !== 404) {
					throw error;
				}
			}

			if (!execution) {
				await sleep(this.n8nPollIntervalMs);
				continue;
			}

			if (this.isExecutionFinished(execution)) {
				return execution;
			}
			await sleep(this.n8nPollIntervalMs);
		}

		throw new Error(`n8n execution ${executionId} did not finish within ${this.n8nRunTimeoutMs}ms`);
	}

	private async getExecution(executionId: string): Promise<JsonObject> {
		const payload = await this.request({
			path: `/executions/${executionId}`,
			method: 'GET',
			query: {
				includeData: true,
			},
		});

		return toRecord(payload);
	}

	private isExecutionFinished(execution: JsonObject): boolean {
		const finished = execution.finished;
		if (typeof finished === 'boolean') {
			return finished;
		}

		const status = execution.status;
		if (typeof status === 'string') {
			return !['new', 'running', 'waiting'].includes(status);
		}

		return false;
	}

	private extractRunData(execution: JsonObject): Record<string, JsonArray> {
		const rootData = toRecord(execution.data);
		const resultData = toRecord(rootData.resultData ?? execution.resultData);
		const runData = toRecord(resultData.runData);
		return Object.fromEntries(
			Object.entries(runData).map(([key, value]) => {
				if (!Array.isArray(value)) {
					throw new Error(`runData entry "${key}" is not an array`);
				}
				return [key, value];
			}),
		);
	}

	private async request({
		path,
		method,
		query,
		body,
		expectedStatusCodes,
	}: {
		path: string;
		method: 'GET' | 'POST' | 'DELETE' | 'PUT';
		query?: Record<string, string | number | boolean | undefined>;
		body?: unknown;
		expectedStatusCodes?: number[];
	}): Promise<unknown> {
		const headers: Record<string, string> = {
			'X-N8N-API-KEY': this.n8nApiKey,
		};

		if (this.n8nBasicAuthHeader) {
			headers.Authorization = this.n8nBasicAuthHeader;
		}

		return requestJson({
			baseUrl: this.n8nBaseUrl,
			path: `${this.n8nApiBasePath}${path}`,
			method,
			query,
			body,
			expectedStatusCodes,
			headers,
		});
	}

	private async requestRest({
		path,
		method,
		query,
		body,
		expectedStatusCodes,
	}: {
		path: string;
		method: 'GET' | 'POST' | 'DELETE';
		query?: Record<string, string | number | boolean | undefined>;
		body?: unknown;
		expectedStatusCodes?: number[];
	}): Promise<unknown> {
		await this.ensureRestLogin();

		const headers: Record<string, string> = {
			'X-N8N-API-KEY': this.n8nApiKey,
		};

		if (this.n8nBasicAuthHeader) {
			headers.Authorization = this.n8nBasicAuthHeader;
		}

		if (this.restCookie) {
			headers.Cookie = this.restCookie;
		}

		return requestJson({
			baseUrl: this.n8nBaseUrl,
			path: `${this.n8nRestBasePath}${path}`,
			method,
			query,
			body,
			expectedStatusCodes,
			headers,
		});
	}

	private async ensureRestLogin(): Promise<void> {
		if (this.restCookie) {
			return;
		}

		if (!this.n8nRestLoginEmail || !this.n8nRestLoginPassword) {
			throw new Error(
				'n8n REST API requests require N8N_REST_LOGIN_EMAIL and N8N_REST_LOGIN_PASSWORD.',
			);
		}

		if (!this.restLoginPromise) {
			this.restLoginPromise = this.generateCookie().finally(() => {
				this.restLoginPromise = undefined;
			});
		}

		await this.restLoginPromise;
	}

	private async generateCookie() {
		const url = createUrl('/rest/login', this.n8nBaseUrl);
		const loginResponse = await runtimeFetch(url.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				emailOrLdapLoginId: this.n8nRestLoginEmail,
				password: this.n8nRestLoginPassword,
			}),
		});

		const setCookieHeader = loginResponse.headers?.get('set-cookie') ?? '';
		this.restCookie = extractCookieHeader(setCookieHeader);
		if (!this.restCookie) {
			throw new Error('n8n login did not return a session cookie');
		}
	}
}

function unwrapData(payload: unknown): unknown {
	const payloadRecord = toRecord(payload);
	if ('data' in payloadRecord) {
		return payloadRecord.data;
	}

	return payload;
}

function tryGetExecution(payload: unknown): JsonObject | undefined {
	const candidate = unwrapData(payload);
	const record = asRecord(candidate);
	if (!record) {
		return undefined;
	}

	const hasExecutionFields = 'finished' in record || 'status' in record || 'resultData' in record;
	if (!hasExecutionFields) {
		return undefined;
	}

	return record;
}

function extractExecutionId(payload: unknown): string | undefined {
	const root = asRecord(payload);
	if (!root) {
		return undefined;
	}

	const directExecutionId = extractString(root, 'executionId');
	if (directExecutionId) {
		return directExecutionId;
	}

	const dataRecord = asRecord(root.data);
	if (!dataRecord) {
		return undefined;
	}

	return extractString(dataRecord, 'executionId') ?? extractString(dataRecord, 'id');
}

function extractString(record: JsonObject, key: string): string | undefined {
	const value = record[key];
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}

	if (typeof value === 'number') {
		return String(value);
	}

	return undefined;
}

function asRecord(value: unknown): JsonObject | undefined {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return undefined;
	}

	return value as JsonObject;
}

function extractArray(value: unknown): JsonArray | undefined {
	if (Array.isArray(value)) {
		return value;
	}

	return undefined;
}

function toRecord(value: unknown): JsonObject {
	const record = asRecord(value);
	if (!record) {
		throw new Error(`Expected object value, got: ${JSON.stringify(value)}`);
	}

	return record;
}

function trimTrailingSlash(value: string): string {
	return value.endsWith('/') ? value.slice(0, -1) : value;
}

function joinPath(basePath: string, segment: string): string {
	const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
	const normalizedSegment = segment.startsWith('/') ? segment.slice(1) : segment;
	return `${normalizedBase}/${normalizedSegment}`;
}

function extractCookieHeader(setCookieHeader: string): string | undefined {
	if (!setCookieHeader) {
		return undefined;
	}

	const ignoredAttributes = new Set([
		'Path',
		'Expires',
		'Max-Age',
		'Domain',
		'Secure',
		'HttpOnly',
		'SameSite',
	]);
	const cookies: string[] = [];
	const matches = setCookieHeader.matchAll(/(?:^|,)\s*([^=;,\s]+)=([^;,\s]+)/g);
	for (const match of matches) {
		const name = match[1];
		const value = match[2];
		if (!name || ignoredAttributes.has(name)) {
			continue;
		}
		cookies.push(`${name}=${value}`);
	}

	if (cookies.length === 0) {
		return undefined;
	}

	return cookies.join('; ');
}

function buildNodeExecutionError(nodeName: string, runError: JsonObject): Error {
	const description = extractString(runError, 'description') ?? extractString(runError, 'message');
	const httpCode = extractString(runError, 'httpCode');
	const message = description ?? 'Unknown execution error';
	const data = asRecord(runError.context)?.data ?? runError.context;
	const contextDetails = data ? ` Details: ${JSON.stringify(data)}` : '';
	const httpDetails = httpCode ? ` (HTTP ${httpCode})` : '';
	return new Error(`Node "${nodeName}" failed${httpDetails}: ${message}.${contextDetails}`);
}

function buildBasicAuthHeader(
	user: string | undefined,
	password: string | undefined,
): string | undefined {
	if (!user || !password) {
		return undefined;
	}

	return `Basic ${base64Encode(`${user}:${password}`)}`;
}
