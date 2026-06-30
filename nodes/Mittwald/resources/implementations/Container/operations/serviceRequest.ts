import type { OperationPropertyConfig } from '../../../base';
import Z from 'zod';

export const containerServiceRequestSchema = Z.object({
	image: Z.string().min(1).optional(),
	command: Z.array(Z.string()).optional(),
	entrypoint: Z.array(Z.string()).optional(),
	environment: Z.record(Z.string(), Z.string()).optional(),
	ports: Z.array(Z.string()).optional(),
	volumes: Z.array(Z.string()).optional(),
	description: Z.string().optional(),
});

export const createServiceRequestSchema = containerServiceRequestSchema.extend({
	image: Z.string().min(1),
	description: Z.string().min(1),
});

export const updateStackWithServiceRequestSchema = Z.object({
	services: Z.record(Z.string().min(1).max(63), containerServiceRequestSchema),
});

export const createStackWithServiceRequestSchema = Z.object({
	services: Z.record(Z.string().min(1).max(63), createServiceRequestSchema),
});

export const environmentProperty = {
	displayName: 'Environment',
	type: 'fixedCollection',
	default: {},
	required: false,
	typeOptions: {
		multipleValues: true,
	},
	options: [
		{
			displayName: 'Variable',
			name: 'variables',
			values: [
				{
					displayName: 'Name',
					name: 'name',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					default: '',
				},
			],
		},
	],
} as unknown as OperationPropertyConfig;

interface EnvironmentCollection {
	variables?: Array<{
		name?: string;
		value?: string;
	}>;
}

interface ContainerServiceRequest {
	image?: string;
	command?: string[];
	entrypoint?: string[];
	environment?: Record<string, string>;
	ports?: string[];
	volumes?: string[];
	description?: string;
}

interface ServiceRequestInput {
	image?: string;
	command?: string;
	entrypoint?: string;
	ports?: string;
	volumes?: string;
	environment?: unknown;
	description?: string;
}

export function buildServiceRequest(input: ServiceRequestInput): ContainerServiceRequest {
	const serviceRequest: ContainerServiceRequest = {};

	if (input.image) {
		serviceRequest.image = input.image;
	}

	const command = parseCommaSeparatedList(input.command);
	if (command) {
		serviceRequest.command = command;
	}

	const entrypoint = parseCommaSeparatedList(input.entrypoint);
	if (entrypoint) {
		serviceRequest.entrypoint = entrypoint;
	}

	const ports = parseCommaSeparatedList(input.ports);
	if (ports) {
		serviceRequest.ports = ports;
	}

	const volumes = parseCommaSeparatedList(input.volumes);
	if (volumes) {
		serviceRequest.volumes = volumes;
	}

	const environment = buildEnvironmentRecord(input.environment);
	if (environment) {
		serviceRequest.environment = environment;
	}

	if (input.description) {
		serviceRequest.description = input.description;
	}

	return serviceRequest;
}

function parseCommaSeparatedList(value?: string): string[] | undefined {
	if (!value) {
		return undefined;
	}

	const values = value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);

	if (values.length === 0) {
		return undefined;
	}

	return values;
}

function buildEnvironmentRecord(environment?: unknown): Record<string, string> | undefined {
	if (!environment || typeof environment !== 'object') {
		return undefined;
	}

	const variables = (environment as EnvironmentCollection).variables ?? [];
	const environmentRecord: Record<string, string> = {};
	for (const variable of variables) {
		if (!variable.name) {
			continue;
		}

		environmentRecord[variable.name] = variable.value ?? '';
	}

	if (Object.keys(environmentRecord).length === 0) {
		return undefined;
	}

	return environmentRecord;
}
