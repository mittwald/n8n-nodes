import { requestJson } from './http';

type JsonObject = Record<string, unknown>;

export interface MittwaldProject extends JsonObject {
	id: string;
	description?: string;
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

	public async deleteProject(projectId: string): Promise<void> {
		await this.request({
			path: `/v2/projects/${projectId}`,
			method: 'DELETE',
			expectedStatusCodes: [200, 202, 204, 404],
		});
	}

	private async request({
		path,
		method,
		body,
		expectedStatusCodes,
	}: {
		path: string;
		method: 'GET' | 'DELETE' | 'POST' | 'PUT';
		body?: unknown;
		expectedStatusCodes?: number[];
	}) {
		return requestJson({
			baseUrl: this.baseUrl,
			path,
			method,
			body,
			expectedStatusCodes,
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
