import { requestJson } from './http';
import { sleep } from './runtime';

type JsonObject = Record<string, unknown>;

export interface MittwaldProject extends JsonObject {
	id: string;
	description?: string;
}

export interface MittwaldApp extends JsonObject {
	id: string;
	name: string;
	tags?: string[];
}

export interface MittwaldAppVersion extends JsonObject {
	id: string;
	externalVersion: string;
}

export interface MittwaldAppVersionDetails extends JsonObject {
	userInputs?: Array<{ name: string; dataType?: string }>;
}

export interface MittwaldAppInstallation extends JsonObject {
	id: string;
	description?: string;
	shortId?: string;
	projectId?: string;
}

export class MittwaldApiClient {
	private readonly apiToken: string;
	private readonly baseUrl: string;

	public constructor(apiToken: string, baseUrl = 'https://api.mittwald.de') {
		this.apiToken = apiToken;
		this.baseUrl = baseUrl;
	}

	public async getProject(projectId: string): Promise<MittwaldProject> {
		const response = await this.request({
			path: `/v2/projects/${projectId}`,
			method: 'GET',
		});
		const record = toRecord(response);
		const id = record.id;
		if (typeof id !== 'string' || id.length === 0) {
			throw new Error('mittwald API did not return a valid project id');
		}

		return record as MittwaldProject;
	}

	public async listProjects(): Promise<MittwaldProject[]> {
		const response = await this.request({
			path: '/v2/projects',
			method: 'GET',
		});
		if (!Array.isArray(response)) {
			throw new Error('Expected projects list response to be an array');
		}

		return response as MittwaldProject[];
	}

	public async deleteProject(projectId: string): Promise<void> {
		await this.request({
			path: `/v2/projects/${projectId}`,
			method: 'DELETE',
			expectedStatusCodes: [200, 202, 204, 404],
		});
	}

	public async listApps(): Promise<MittwaldApp[]> {
		const response = await this.request({
			path: '/v2/apps',
			method: 'GET',
		});
		if (!Array.isArray(response)) {
			throw new Error('Expected apps list response to be an array');
		}
		return response as MittwaldApp[];
	}

	public async listAppVersions(appId: string): Promise<MittwaldAppVersion[]> {
		const response = await this.request({
			path: `/v2/apps/${appId}/versions`,
			method: 'GET',
		});
		if (!Array.isArray(response)) {
			throw new Error('Expected app versions response to be an array');
		}
		return response as MittwaldAppVersion[];
	}

	public async getAppVersionDetails(
		appId: string,
		versionId: string,
	): Promise<MittwaldAppVersionDetails> {
		const response = await this.request({
			path: `/v2/apps/${appId}/versions/${versionId}`,
			method: 'GET',
		});
		return toRecord(response) as MittwaldAppVersionDetails;
	}

	public async searchAppInstallations(searchTerm: string): Promise<MittwaldAppInstallation[]> {
		const response = await this.request({
			path: `/v2/app-installations`,
			method: 'GET',
			query: {
				searchTerm,
			},
		});
		if (!Array.isArray(response)) {
			throw new Error('Expected app installations response to be an array');
		}
		return response as MittwaldAppInstallation[];
	}

	public async waitForAppInstallationByDescription({
		description,
		timeoutMs = 120000,
		pollIntervalMs = 2000,
	}: {
		description: string;
		timeoutMs?: number;
		pollIntervalMs?: number;
	}): Promise<MittwaldAppInstallation> {
		const deadline = Date.now() + timeoutMs;

		while (Date.now() <= deadline) {
			const installations = await this.searchAppInstallations(description);
			const match = installations.find((installation) => installation.description === description);
			if (match) {
				return match;
			}
			await sleep(pollIntervalMs);
		}

		throw new Error(`Timed out waiting for app installation "${description}"`);
	}

	private async request({
		path,
		method,
		body,
		expectedStatusCodes,
		query,
	}: {
		path: string;
		method: 'GET' | 'DELETE' | 'POST' | 'PUT';
		body?: unknown;
		expectedStatusCodes?: number[];
		query?: Record<string, string | number | boolean | undefined>;
	}) {
		return requestJson({
			baseUrl: this.baseUrl,
			path,
			method,
			body,
			expectedStatusCodes,
			query,
			headers: {
				Authorization: `Bearer ${this.apiToken}`,
			},
		});
	}
}

function toRecord(value: unknown): JsonObject {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error(`Expected response object, got: ${JSON.stringify(value)}`);
	}

	return value as JsonObject;
}
