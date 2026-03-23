/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { it } from 'vitest';
import { getIntegrationEnv, MittwaldApiClient, runMittwaldOperation, runWorkflow } from './helpers';

type TeardownFn = () => Promise<void> | void;

export interface TestcaseContext {
	teardown: (fn: TeardownFn) => void;
	runOperation: typeof runMittwaldOperation;
	runWorkflow: typeof runWorkflow;
	mittwaldApi: MittwaldApiClient;
	env: ReturnType<typeof getIntegrationEnv>;
}

export function testcase(
	name: string,
	fn: (context: TestcaseContext) => Promise<void>,
	timeoutMs = 10_000,
) {
	it(
		name,
		async () => {
			const env = getIntegrationEnv();
			const mittwaldApi = new MittwaldApiClient(env.mittwaldApiToken);
			const teardowns: TeardownFn[] = [];

			let testError: unknown;
			try {
				await fn({
					teardown: (teardownFn) => teardowns.push(teardownFn),
					runOperation: runMittwaldOperation,
					runWorkflow,
					mittwaldApi,
					env,
				});
			} catch (error) {
				testError = error;
			}

			const teardownErrors: Error[] = [];
			for (const teardownFn of teardowns.reverse()) {
				try {
					await teardownFn();
				} catch (error) {
					teardownErrors.push(toError(error));
				}
			}

			if (testError && teardownErrors.length > 0) {
				throw new AggregateError(
					[toError(testError), ...teardownErrors],
					'Test execution failed and one or more teardown steps failed',
				);
			}

			if (testError) {
				throw testError;
			}

			if (teardownErrors.length === 1) {
				throw teardownErrors[0];
			}

			if (teardownErrors.length > 1) {
				throw new AggregateError(teardownErrors, 'One or more teardown steps failed');
			}
		},
		timeoutMs,
	);
}

function toError(value: unknown): Error {
	if (value instanceof Error) {
		return value;
	}

	return new Error(String(value));
}

export function readRequiredString(source: Record<string, unknown>, key: string): string {
	const value = source[key];
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}

	throw new Error(`Expected property "${key}" to be a non-empty string`);
}
