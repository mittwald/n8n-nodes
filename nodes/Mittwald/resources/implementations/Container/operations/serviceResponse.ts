import Z from 'zod';

/**
 * `PATCH /stacks/{stackId}` answers with the whole stack, so returning it
 * unchanged would put the stack ID into `id` and every follow-up operation
 * taking a service ID would fail. Only the touched service is of interest.
 */
export const stackWithServicesResponseSchema = Z.object({
	// Optional in the API contract, so an empty stack must not fail validation.
	services: Z.array(
		Z.object({
			id: Z.string(),
			serviceName: Z.string(),
		}).passthrough(),
	).optional(),
});

type StackWithServices = Z.infer<typeof stackWithServicesResponseSchema>;

export const selectService = (stack: StackWithServices, serviceName: string) => {
	const service = stack.services?.find((entry) => entry.serviceName === serviceName);
	if (!service) {
		throw new Error(`Service ${serviceName} is missing from the stack response`);
	}

	return service;
};
