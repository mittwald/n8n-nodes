import type { JsonObject } from '../shared';
import type { PollingConfig } from './polling';

type ResponseHeaders = Record<string, unknown>;

export interface RequestConfig<TBody = JsonObject, TRequestBody = JsonObject> {
	path: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	body?: TBody;
	polling?: PollingConfig<TRequestBody>;
	qs?: Record<string, string | undefined>;
	returnFullResponse?: true;
}

export interface Response<TBody = JsonObject> {
	statusCode: number;
	body: TBody;
	headers: ResponseHeaders;
}
