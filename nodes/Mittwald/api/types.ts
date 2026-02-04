import type { JsonObject } from '../shared';
import type { PollingConfig } from './polling';

type ResponseHeaders = Record<string, unknown>;

export interface RequestConfig<TBody = JsonObject> {
	path: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	body?: TBody;
	polling?: PollingConfig<TBody>;
	qs?: Record<string, string | undefined>;
	returnFullResponse?: true;
}

export interface Response<TBody = JsonObject> {
	statusCode: number;
	body: TBody;
	headers: ResponseHeaders;
}
