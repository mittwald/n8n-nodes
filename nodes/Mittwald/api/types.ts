import type { JsonObject } from '../shared';
import type { PollingConfig } from './polling';
import Z from 'zod';

type ResponseHeaders = Record<string, unknown>;

export interface RequestConfigWithPagination {
	pagination: {
		token?: string;
		pageSize?: number;
	};
}

export interface RequestConfigWithFullResponse {
	returnFullResponse: true;
}

export type RequestConfig<TRequestBody = JsonObject, TResponseBody = JsonObject> = {
	path: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	body?: NoInfer<TRequestBody>;
	polling?: PollingConfig<TResponseBody>;
	qs?: Record<string, string | number | undefined>;
	requestSchema?: Z.Schema<TRequestBody>;
	responseSchema?: Z.Schema<TResponseBody>;
} & Partial<RequestConfigWithFullResponse & RequestConfigWithPagination>;

export interface Response<TBody = JsonObject> {
	statusCode: number;
	body: TBody;
	headers: ResponseHeaders;
	nextPaginationToken?: string;
}
