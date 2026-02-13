import { type Logger, sleep } from 'n8n-workflow';
import type { Response } from './types';
import type { JsonObject } from '../shared';

export type PollingRequestCondition<TBody = JsonObject> = (response: Response<TBody>) => boolean;

export interface PollingConfig<TBody = JsonObject> {
	waitUntil: PollingRequestCondition<TBody> | { status: number } | { untilSuccess: true };
	timeoutMs?: number;
}

interface PollExecutionConfig<TBody = JsonObject> {
	config: PollingConfig<TBody>;
	executeRequest: () => Promise<Response<TBody>>;
	logger: Logger;
}

function buildPollingFunction<TBody>(
	waitUntil: PollingConfig<TBody>['waitUntil'],
): PollingRequestCondition<TBody> {
	if (typeof waitUntil === 'function') {
		return waitUntil;
	}

	if ('status' in waitUntil) {
		return (response) => response.statusCode === waitUntil.status;
	}

	if ('untilSuccess' in waitUntil) {
		return (response) => {
			if (response.statusCode >= 200 && response.statusCode < 300) {
				return true;
			}

			if (response.statusCode === 403) {
				return false;
			}

			throw new Error(`unexpected status code ${response.statusCode} received: ${JSON.stringify(response.body)}`);
		};
	}

	return () => true;
}

export const poll = async <TBody = JsonObject>(
	executionConfig: PollExecutionConfig<TBody>,
): Promise<Response<TBody>> => {
	const { config, executeRequest, logger } = executionConfig;
	const { timeoutMs = 2000 } = config;

	let backoff = 100;
	const maxTime = Date.now() + timeoutMs;
	const waitUntil = buildPollingFunction(config.waitUntil);

	while (true) {
		if (Date.now() > maxTime) {
			throw new Error(`polling timed out after ${timeoutMs} ms`);
		}
		const response = await executeRequest();

		if (waitUntil(response)) {
			return response as Response<TBody>;
		}

		logger.warn(`polling request condition not fulfilled: retrying...`);

		await sleep(backoff);
		backoff = Math.min(backoff * 2, 2000); //
	}
};
