/* eslint-disable @n8n/community-nodes/no-restricted-globals */
type GlobalEnv = {
	process?: {
		env?: Record<string, string | undefined>;
	};
};

type SearchParamsLike = {
	set: (key: string, value: string) => void;
};

type UrlLike = {
	searchParams: SearchParamsLike;
	toString: () => string;
};

type UrlConstructor = new (input: string, base?: string) => UrlLike;

interface FetchInit {
	method?: string;
	headers?: Record<string, string>;
	body?: string;
}

interface FetchResponse {
	status: number;
	text: () => Promise<string>;
	headers?: {
		get: (name: string) => string | null;
	};
}

type FetchFn = (input: string, init?: FetchInit) => Promise<FetchResponse>;
type SetTimeoutFn = (handler: () => void, timeout?: number) => unknown;
type BufferLike = {
	from: (input: string) => { toString: (encoding: 'base64') => string };
};

export function env(name: string): string | undefined {
	return (globalThis as unknown as GlobalEnv).process?.env?.[name];
}

export function setEnv(name: string, value: string): void {
	const envRecord = (globalThis as unknown as GlobalEnv).process?.env;
	if (!envRecord) {
		return;
	}
	envRecord[name] = value;
}

export function createUrl(path: string, baseUrl: string): UrlLike {
	const URLImpl = (globalThis as unknown as { URL?: UrlConstructor }).URL;
	if (!URLImpl) {
		throw new Error('Global URL implementation is not available');
	}

	return new URLImpl(path, baseUrl);
}

export async function runtimeFetch(input: string, init?: FetchInit): Promise<FetchResponse> {
	const fetchImpl = (globalThis as unknown as { fetch?: FetchFn }).fetch;
	if (!fetchImpl) {
		throw new Error('Global fetch implementation is not available');
	}

	return fetchImpl(input, init);
}

export async function sleep(ms: number): Promise<void> {
	const setTimeoutImpl = (globalThis as unknown as { setTimeout?: SetTimeoutFn }).setTimeout;
	if (!setTimeoutImpl) {
		throw new Error('Global setTimeout implementation is not available');
	}

	await new Promise<void>((resolve) => {
		setTimeoutImpl(resolve, ms);
	});
}

export function base64Encode(value: string): string {
	const bufferImpl = (globalThis as unknown as { Buffer?: BufferLike }).Buffer;
	if (bufferImpl) {
		return bufferImpl.from(value).toString('base64');
	}

	const btoaImpl = (globalThis as unknown as { btoa?: (input: string) => string }).btoa;
	if (btoaImpl) {
		return btoaImpl(value);
	}

	throw new Error('No base64 encoder available for Basic Auth');
}
