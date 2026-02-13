import type { JsonObject } from '../shared';
import type { PollingConfig } from './polling';
import Z from 'zod';
import { IDataObject } from 'n8n-workflow';

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
	body?: NoInfer<Record<keyof TRequestBody, unknown>>;
	polling?: PollingConfig<TResponseBody>;
	qs?: IDataObject;
	requestSchema?: Z.Schema<TRequestBody>;
	responseSchema?: Z.Schema<TResponseBody>;
} & Partial<RequestConfigWithFullResponse & RequestConfigWithPagination>;

export interface Response<TBody = JsonObject> {
	statusCode: number;
	body: TBody;
	headers: ResponseHeaders;
	nextPaginationToken?: string;
}
