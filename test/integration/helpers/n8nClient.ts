/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import axios from 'axios';
import { setTimeout as sleep } from 'node:timers/promises';
import type { IntegrationEnv } from './env';

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

const asRecord = (value: unknown): JsonObject | undefined => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return undefined;
	}

	return value as JsonObject;
};

const extractArray = (value: unknown): JsonArray | undefined => {
	if (Array.isArray(value)) {
		return value;
	}

	return undefined;
};

const requireRecord = (value: unknown): JsonObject => {
	const record = asRecord(value);
	if (!record) {
		throw new Error(`Expected object value, got: ${JSON.stringify(value)}`);
	}

	return record;
};

const trimTrailingSlash = (value: string): string =>
	value.endsWith('/') ? value.slice(0, -1) : value;

const extractCookieHeader = (
	setCookieHeader: string | string[] | undefined,
): string | undefined => {
	if (!setCookieHeader) {
		return undefined;
	}

	const headerValues = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
	const cookies = headerValues
		.map((headerValue) => headerValue.split(';', 1)[0])
		.filter((cookie): cookie is string => Boolean(cookie));

	if (cookies.length === 0) {
		return undefined;
	}

	return cookies.join('; ');
};

const extractString = (record: JsonObject, key: string): string | undefined => {
	const value = record[key];
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}

	if (typeof value === 'number') {
		return String(value);
	}

	return undefined;
};

const unwrapData = (payload: unknown): unknown => {
	const payloadRecord = requireRecord(payload);
	if ('data' in payloadRecord) {
		return payloadRecord.data;
	}

	return payload;
};

const tryGetExecution = (payload: unknown): JsonObject | undefined => {
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
};

const extractExecutionId = (payload: unknown): string | undefined => {
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
};

const extractRunPayloadError = (payload: unknown): string | undefined => {
	const root = asRecord(payload);
	if (!root) {
		return undefined;
	}

	const directMessage = extractString(root, 'message');
	if (directMessage) {
		return directMessage;
	}

	const errorRecord = asRecord(root.error) ?? asRecord(asRecord(root.data)?.error);
	if (!errorRecord) {
		return undefined;
	}

	return (
		extractString(errorRecord, 'message') ??
		extractString(errorRecord, 'description') ??
		extractString(errorRecord, 'name')
	);
};

export class N8nApiClient {
	private readonly n8nBaseUrl: string;
	private readonly n8nApiKey: string;
	private readonly n8nApiBasePath: string;
	private readonly n8nRestBasePath: string;
	private readonly n8nRunTimeoutMs: number;
	private readonly n8nPollIntervalMs: number;
	private readonly n8nRestLoginEmail: string;
	private readonly n8nRestLoginPassword: string;
	private restCookie?: string;
	private restLoginPromise?: Promise<void>;

	private static instance?: N8nApiClient;

	public constructor(env: IntegrationEnv) {
		this.n8nBaseUrl = env.n8nBaseUrl;
		this.n8nApiKey = env.n8nApiKey;
		this.n8nApiBasePath = trimTrailingSlash(env.n8nApiBasePath);
		this.n8nRestBasePath = trimTrailingSlash(env.n8nRestBasePath);
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

		const workflowRecord = requireRecord(unwrapData(payload));
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

	public async runWorkflowViaRestRun({
		workflowId,
		triggerNodeName = 'Start Node',
	}: {
		workflowId: string;
		triggerNodeName?: string;
	}): Promise<N8nRunResult> {
		const existingExecutions = await this.listExecutions({ workflowId, limit: 10 });
		const existingIds = new Set(existingExecutions.map((execution) => execution.id));

		const runPayload = await this.requestRest({
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

		const directExecution = tryGetExecution(runPayload);
		if (directExecution && this.isExecutionFinished(directExecution)) {
			const directExecutionId = extractString(directExecution, 'id') ?? workflowId;
			return { executionId: directExecutionId, execution: directExecution };
		}

		const payloadError = extractRunPayloadError(runPayload);
		if (payloadError) {
			throw new Error(`n8n workflow run failed: ${payloadError}`);
		}

		const executionId =
			extractExecutionId(runPayload) ?? (await this.waitForNewExecution(workflowId, existingIds));
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

		const record = requireRecord(unwrapData(payload));
		const id = extractString(record, 'id');
		const createdName = extractString(record, 'name') ?? name;
		const createdType = extractString(record, 'type') ?? type;
		if (!id) {
			throw new Error('n8n did not return a credential id');
		}

		return { id, name: createdName, type: createdType };
	}

	public async deleteCredential(credentialId: string): Promise<void> {
		await this.request({
			path: `/credentials/${credentialId}`,
			method: 'DELETE',
			expectedStatusCodes: [200, 202, 204, 404],
		});
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
		const runRecord = requireRecord(lastRun);
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
			const itemRecord = requireRecord(item);
			const json = requireRecord(itemRecord.json);
			return {
				...itemRecord,
				json,
				index,
			};
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

		throw new Error(
			`No new execution found for workflow ${workflowId}. This can happen if the workflow is invalid or failed to start.`,
		);
	}

	private async waitForExecution(executionId: string): Promise<JsonObject> {
		const deadline = Date.now() + this.n8nRunTimeoutMs;

		while (Date.now() <= deadline) {
			let execution: JsonObject | undefined;
			try {
				execution = await this.getExecution(executionId);
			} catch (error) {
				if (!axios.isAxiosError(error) || error.response?.status !== 404) {
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

		return requireRecord(payload);
	}

	private isExecutionFinished(execution: JsonObject): boolean {
		const status = execution.status;
		if (typeof status === 'string') {
			if (!['new', 'running', 'waiting'].includes(status)) {
				return true;
			}
		}

		const finished = execution.finished;
		if (typeof finished === 'boolean') {
			return finished;
		}

		return false;
	}

	private extractRunData(execution: JsonObject): Record<string, JsonArray> {
		const rootData = requireRecord(execution.data);
		const resultData = requireRecord(rootData.resultData ?? execution.resultData);
		const runData = requireRecord(resultData.runData);
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
		return this.requestWithBasePath({
			basePath: this.n8nApiBasePath,
			path,
			method,
			query,
			body,
			expectedStatusCodes,
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
		return this.requestWithBasePath({
			basePath: this.n8nRestBasePath,
			path,
			method,
			query,
			body,
			expectedStatusCodes,
			includeRestCookie: true,
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
		const loginResponse = await axios.post(
			'/rest/login',
			{
				emailOrLdapLoginId: this.n8nRestLoginEmail,
				password: this.n8nRestLoginPassword,
			},
			{
				baseURL: this.n8nBaseUrl,
			},
		);

		const setCookieHeader = loginResponse.headers['set-cookie'];
		this.restCookie = extractCookieHeader(setCookieHeader);
		if (!this.restCookie) {
			throw new Error('n8n login did not return a session cookie');
		}
	}

	private async requestWithBasePath({
		basePath,
		path,
		method,
		query,
		body,
		expectedStatusCodes,
		includeRestCookie = false,
	}: {
		basePath: string;
		path: string;
		method: 'GET' | 'POST' | 'DELETE' | 'PUT';
		query?: Record<string, string | number | boolean | undefined>;
		body?: unknown;
		expectedStatusCodes?: number[];
		includeRestCookie?: boolean;
	}): Promise<unknown> {
		const headers: Record<string, string> = {
			'X-N8N-API-KEY': this.n8nApiKey,
		};
		if (includeRestCookie && this.restCookie) {
			headers.Cookie = this.restCookie;
		}

		const response = await axios.request({
			baseURL: this.n8nBaseUrl,
			url: `${basePath}${path}`,
			method,
			params: query,
			data: body,
			headers,
			validateStatus: expectedStatusCodes
				? (status) => expectedStatusCodes.includes(status)
				: undefined,
		});

		return response.data;
	}
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
