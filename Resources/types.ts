import { OperationPropertyConfig } from './OperationProperty';
import { IDataObject } from 'n8n-workflow';

export interface RequestConfig {
	path: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	body?: any;
	ignoreHttpStatusErrors?: boolean;
}

export type PollingRequestCondition<TRes extends RequestResponse = RequestResponse> = (
	response: TRes,
) => boolean;

export interface RequestResponse {
	statusCode: number;
	body: any;
	headers: Record<string, unknown>;
}

export const pollStatus =
	(status: number): PollingRequestCondition =>
	(response) =>
		response.statusCode === status;

export interface PollStatusRequestConfig<TRes extends RequestResponse = RequestResponse>
	extends RequestConfig {
	waitUntil: PollingRequestCondition<TRes>;
	timeoutMs?: number;
}

export interface ExecutionContext<TProps extends OperationProperties = OperationProperties> {
	properties: TProps;
	request: {
		execute: (config: RequestConfig) => Promise<any>;
		executeWithPolling: <TRes extends RequestResponse = RequestResponse>(
			config: PollStatusRequestConfig<TRes>,
		) => Promise<TRes>;
	};
}

export type OperationProperties = Record<string, OperationPropertyConfig>;

export type ExecutionFunction<TProps extends OperationProperties = OperationProperties> = (
	context: ExecutionContext<TProps>,
) => Promise<IDataObject>;

export type OperationPropertyType<T> = T extends OperationPropertyConfig
	? T extends { type: 'boolean' }
		? boolean | T['default']
		: T extends { type: 'number' }
			? number | T['default']
			: T extends { type: 'string' }
				? string | T['default']
				: T extends { type: 'resourceLocator' }
					? string | T['default']
					: never
	: never;

export interface OperationBuilder<TProps extends OperationProperties> {
	withProperties(properties: TProps): {
		withExecuteFn(fn: ExecutionFunction<TProps>): void;
	};
}

export interface OperationConfig {
	name: string;
	action: string;
}
