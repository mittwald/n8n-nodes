/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import axios, { type AxiosInstance } from 'axios';

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

export class MittwaldApiClient {
	private readonly client: AxiosInstance;

	public constructor(apiToken: string, baseUrl = 'https://api.mittwald.de') {
		this.client = axios.create({
			baseURL: baseUrl,
			headers: {
				Authorization: `Bearer ${apiToken}`,
			},
		});
	}

	public async getProject(projectId: string): Promise<MittwaldProject> {
		const response = await this.request({
			path: `/v2/projects/${projectId}`,
			method: 'GET',
			expectedStatusCodes: [200],
		});

		const id = response.id;
		if (typeof id !== 'string' || id.length === 0) {
			throw new Error('mittwald API did not return a valid project id');
		}

		return response as MittwaldProject;
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
		return (await this.request({
			path: `/v2/apps/${appId}/versions/${versionId}`,
			method: 'GET',
		})) as MittwaldAppVersionDetails;
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
		const response = await this.client.request({
			url: path,
			method,
			data: body,
			params: query,
			validateStatus: expectedStatusCodes
				? (status) => expectedStatusCodes.includes(status)
				: undefined,
		});

		return response.data;
	}
}
