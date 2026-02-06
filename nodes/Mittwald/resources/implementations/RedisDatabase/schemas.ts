import Z from 'zod';

/**
 * Schema for a Redis database configuration object
 */
export const RedisDatabaseConfigurationSchema = Z.object({
	additionalFlags: Z.array(Z.string().min(1)).optional(),
	maxMemory: Z.string().optional(),
	maxMemoryPolicy: Z.string().optional(),
	persistent: Z.boolean().optional(),
});

/**
 * Schema for a full Redis database object returned by the API
 */
export const RedisDatabaseSchema = Z.object({
	id: Z.string().uuid(),
	projectId: Z.string().uuid(),
	name: Z.string(),
	description: Z.string(),
	version: Z.string(),
	hostname: Z.string(),
	port: Z.number().int(),
	status: Z.enum(['pending', 'ready', 'migrating', 'importing', 'error']),
	createdAt: Z.string().datetime(),
	updatedAt: Z.string().datetime(),
	statusSetAt: Z.string().datetime(),
	storageUsageInBytes: Z.number().int(),
	storageUsageInBytesSetAt: Z.string().datetime(),
	configuration: RedisDatabaseConfigurationSchema.optional(),
	finalizers: Z.array(Z.string().min(1)).optional(),
});

/**
 * Schema for the response when creating a Redis database (returns only the ID)
 */
export const CreateRedisDatabaseResponseSchema = Z.object({
	id: Z.string().uuid(),
});

/**
 * Schema for the request body when creating a Redis database
 */
export const CreateRedisDatabaseRequestSchema = Z.object({
	description: Z.string(),
	version: Z.string(),
});

/**
 * Schema for listing Redis databases (array of database objects)
 */
export const ListRedisDatabasesResponseSchema = Z.array(RedisDatabaseSchema);
