import { sleep, type Logger } from 'n8n-workflow';
import type { Response } from './types';
import type { JsonObject } from '../shared';

export type PollingRequestCondition<TBody = JsonObject> = (response: Response<TBody>) => boolean;

export interface PollingConfig<TBody = JsonObject> {
	waitUntil: PollingRequestCondition<TBody> | { status: number };
	timeoutMs?: number;
}

interface PollExecutionConfig<TBody = JsonObject> {
	config: PollingConfig<TBody>;
	executeRequest: () => Promise<Response<TBody>>;
	logger: Logger;
}

export const poll = async <TBody = JsonObject>(
	executionConfig: PollExecutionConfig<TBody>,
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
				: 'status' in waitUntil
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
