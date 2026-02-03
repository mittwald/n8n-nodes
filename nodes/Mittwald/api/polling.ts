import { sleep, type Logger } from 'n8n-workflow';
import type { Response } from './types';
import type { JsonObject } from '../shared';

export type PollingRequestCondition = (response: Response) => boolean;

export interface PollingConfig {
	waitUntil: PollingRequestCondition | { status: number };
	timeoutMs?: number;
}

interface PollExecutionConfig {
	config: PollingConfig;
	executeRequest: () => Promise<Response>;
	logger: Logger;
}

export const poll = async <TBody = JsonObject>(
	executionConfig: PollExecutionConfig,
): Promise<Response<TBody>> => {
	const { config, executeRequest, logger } = executionConfig;
	const { waitUntil, timeoutMs = 2000 } = config;
	let backoff = 100;
	const maxTime = Date.now() + timeoutMs;

	while (true) {
		if (Date.now() > maxTime) {
			throw new Error(`polling timed out after ${timeoutMs} ms`);
		}
		const response = await executeRequest();

		if (
			typeof waitUntil === 'function'
				? waitUntil(response)
				: 'statusCode' in waitUntil
					? response.statusCode === waitUntil.status
					: false
		) {
			return response as Response<TBody>;
		}

		logger.warn(`polling request condition not fulfilled: retrying...`);

		await sleep(backoff);
		backoff = Math.min(backoff * 2, 2000); //
	}
};
