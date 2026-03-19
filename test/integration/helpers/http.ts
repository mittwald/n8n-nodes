import { createUrl, runtimeFetch } from './runtime';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type QueryParams = Record<string, string | number | boolean | undefined>;

export class HttpError extends Error {
	public readonly statusCode: number;
	public readonly responseText: string;
	public readonly url: string;
	public readonly method: HttpMethod;

	public constructor({
		statusCode,
		responseText,
		url,
		method,
	}: {
		statusCode: number;
		responseText: string;
		url: string;
		method: HttpMethod;
	}) {
		super(
			`HTTP ${statusCode} ${method} ${url}: ${responseText.slice(0, 500) || 'No response body'}`,
		);
		this.name = 'HttpError';
		this.statusCode = statusCode;
		this.responseText = responseText;
		this.url = url;
		this.method = method;
	}
}

export async function requestJson<TResponse = unknown>({
	baseUrl,
	path,
	method,
	headers = {},
	query,
	body,
	expectedStatusCodes = [200, 201, 202, 204],
}: {
	baseUrl: string;
	path: string;
	method: HttpMethod;
	headers?: Record<string, string>;
	query?: QueryParams;
	body?: unknown;
	expectedStatusCodes?: number[];
}): Promise<TResponse> {
	const url = createUrl(path, baseUrl);

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined) {
				continue;
			}
			url.searchParams.set(key, String(value));
		}
	}

	const hasContentTypeHeader = Object.keys(headers).some(
		(headerName) => headerName.toLowerCase() === 'content-type',
	);
	const requestHeaders =
		body === undefined || hasContentTypeHeader
			? headers
			: { ...headers, 'Content-Type': 'application/json' };

	const response = await runtimeFetch(url.toString(), {
		method,
		headers: requestHeaders,
		body: body === undefined ? undefined : JSON.stringify(body),
	});

	const responseText = await response.text();
	if (!expectedStatusCodes.includes(response.status)) {
		throw new HttpError({
			statusCode: response.status,
			responseText,
			url: url.toString(),
			method,
		});
	}

	if (!responseText) {
		return undefined as TResponse;
	}

	try {
		return JSON.parse(responseText) as TResponse;
	} catch (error) {
		throw new Error(
			`Failed to parse JSON response for ${method} ${url.toString()}: ${String(error)}`,
		);
	}
}
