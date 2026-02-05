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
		const {
			path,
			polling,
			requestSchema,
			responseSchema,
			returnFullResponse,
			...restRequestConfig
		} = requestConfig;

		const pathInfos = `${requestConfig.method} ${requestConfig.path}`;
		logger.info(`[mittwald] ${pathInfos}`);

		if (requestSchema) {
			const { error } = await requestSchema.safeParseAsync(requestConfig.body);
			if (error) {
				throw new Error(`${pathInfos} - Request body validation failed`, {
					cause: error,
				});
			}
		}

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

		logger.info(
			`[mittwald] ${requestConfig.method} ${requestConfig.path} ${fullResponse.statusCode}`,
		);

		if (responseSchema) {
			const { error } = await responseSchema.safeParseAsync(fullResponse.body);
			throw new Error(`${pathInfos} - Response body validation failed`, {
				cause: error,
			});
		}

		if (returnFullResponse) {
			return fullResponse;
		}

		return fullResponse.body;
	}
}
