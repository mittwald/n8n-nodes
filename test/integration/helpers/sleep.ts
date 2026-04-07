/* eslint-disable @n8n/community-nodes/no-restricted-globals */
type SetTimeoutFn = (handler: () => void, timeout?: number) => unknown;

export async function sleep(ms: number): Promise<void> {
	const setTimeoutImpl = (globalThis as unknown as { setTimeout?: SetTimeoutFn }).setTimeout;
	if (!setTimeoutImpl) {
		throw new Error('Global setTimeout implementation is not available');
	}

	await new Promise<void>((resolve) => {
		setTimeoutImpl(resolve, ms);
	});
}
