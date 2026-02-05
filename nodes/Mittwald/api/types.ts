import type { JsonObject } from '../shared';
import type { PollingConfig } from './polling';
import Z from 'zod';

type ResponseHeaders = Record<string, unknown>;

export interface RequestConfig<TRequestBody = JsonObject, TResponseBody = JsonObject> {
	path: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	body?: NoInfer<TRequestBody>;
	polling?: PollingConfig<TResponseBody>;
	qs?: Record<string, string | undefined>;
	returnFullResponse?: true;
	requestSchema?: Z.Schema<TRequestBody>;
	responseSchema?: Z.Schema<TResponseBody>;
}

export interface Response<TBody = JsonObject> {
	statusCode: number;
	body: TBody;
	headers: ResponseHeaders;
}
