/* eslint-disable @n8n/community-nodes/no-restricted-globals */
type GlobalEnv = {
	process?: {
		env?: Record<string, string | undefined>;
	};
};

type SearchParamsLike = {
	set: (key: string, value: string) => void;
};

export type UrlLike = {
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
	const URLImpl = requireGlobal('URL', (globalThis as unknown as { URL?: UrlConstructor }).URL);
	return new URLImpl(path, baseUrl);
}

export async function runtimeFetch(input: string, init?: FetchInit): Promise<FetchResponse> {
	const fetchImpl = requireGlobal('fetch', (globalThis as unknown as { fetch?: FetchFn }).fetch);
	return fetchImpl(input, init);
}

export async function sleep(ms: number): Promise<void> {
	const setTimeoutImpl = requireGlobal(
		'setTimeout',
		(globalThis as unknown as { setTimeout?: SetTimeoutFn }).setTimeout,
	);
	await new Promise<void>((resolve) => {
		setTimeoutImpl(resolve, ms);
	});
}

function requireGlobal<T>(name: string, value: T | undefined): T {
	if (!value) {
		throw new Error(`Global ${name} implementation is not available`);
	}

	return value;
}
