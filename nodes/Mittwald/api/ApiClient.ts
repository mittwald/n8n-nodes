import { type IAllExecuteFunctions } from 'n8n-workflow';
import type { RequestConfig, Response } from './types';
import { poll } from './polling';
import { config, type JsonObject } from '../shared';

export class ApiClient {
	private readonly node: IAllExecuteFunctions;

	public constructor(node: IAllExecuteFunctions) {
		this.node = node;
	}

	public async request<TResponseBody = JsonObject, TRequestBody = JsonObject>(
		requestConfig: RequestConfig<TRequestBody, TResponseBody> & { returnFullResponse: true },
	): Promise<Response<TResponseBody>>;

	public async request<TResponseBody = JsonObject, TRequestBody = JsonObject>(
		requestConfig: RequestConfig<TRequestBody, TResponseBody>,
	): Promise<TResponseBody>;

	public async request<TResponseBody = JsonObject, TRequestBody = JsonObject>(
		requestConfig: RequestConfig<TRequestBody, TResponseBody>,
	): Promise<TResponseBody> {
		const { logger, helpers } = this.node;
		const { path, polling, returnFullResponse, ...restRequestConfig } = requestConfig;

		const executeRequest = () =>
			helpers.httpRequestWithAuthentication.call(this.node, 'mittwaldApi', {
				...restRequestConfig,
				url: path,
				returnFullResponse: true,
				errorResponse: true,
				baseURL: config.apiBaseUrl,
				ignoreHttpStatusErrors: !!polling,
				json: true,
			});

		const fullResponse = polling
			? await poll<TResponseBody>({
					config: polling,
					executeRequest,
					logger,
				})
			: await executeRequest();

		if (returnFullResponse) {
			return fullResponse;
		}

		return fullResponse.body;
	}
}
