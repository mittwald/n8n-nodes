import { type IAllExecuteFunctions } from 'n8n-workflow';
import type {
	RequestConfig,
	RequestConfigWithFullResponse,
	RequestConfigWithPagination,
	Response,
} from './types';
import { poll } from './polling';
import { config, type JsonObject } from '../shared';
import { setupPagination } from './pagination';

export class ApiClient {
	private readonly node: IAllExecuteFunctions;

	public constructor(node: IAllExecuteFunctions) {
		this.node = node;
	}

	public async request<TResponseBody = JsonObject, TRequestBody = JsonObject>(
		requestConfig: RequestConfig<TRequestBody, TResponseBody> & RequestConfigWithFullResponse,
	): Promise<Response<TResponseBody>>;

	public async request<TResponseBody = JsonObject, TRequestBody = JsonObject>(
		requestConfig: RequestConfig<TRequestBody, TResponseBody> & RequestConfigWithPagination,
	): Promise<Response<TResponseBody>>;

	public async request<TResponseBody = JsonObject, TRequestBody = JsonObject>(
		requestConfig: RequestConfig<TRequestBody, TResponseBody>,
	): Promise<TResponseBody>;

	public async request<TResponseBody = JsonObject, TRequestBody = JsonObject>(
		requestConfig: RequestConfig<TRequestBody, TResponseBody>,
	) {
		const { logger, helpers } = this.node;

		const pagination = setupPagination(requestConfig);

		const {
			path,
			polling,
			requestSchema,
			responseSchema,
			returnFullResponse,
			...restRequestConfig
		} = pagination.requestConfig;

		const pathInfos = `${requestConfig.method} ${requestConfig.path}`;
		logger.info(`[mittwald] ${pathInfos}`);

		if (requestSchema) {
			const { error } = await requestSchema.safeParseAsync(requestConfig.body);
			if (error) {
				throw new Error(`${pathInfos} - Request body validation failed: ${error.message}`, {
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
			}) as Promise<Response<TResponseBody>>;

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
			if (error) {
				throw new Error(`${pathInfos} - Response body validation failed: ${error?.message}`, {
					cause: error,
				});
			}
		}

		const fullResponseWithPaginationToken = pagination.withPaginationToken(fullResponse);

		if (returnFullResponse || pagination.enabled) {
			return fullResponseWithPaginationToken;
		}

		return fullResponse.body;
	}
}
