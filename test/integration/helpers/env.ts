import { loadDotEnv } from './dotenv';
import { env } from './runtime';

const requiredEnvVarNames = [
	'N8N_BASE_URL',
	'N8N_API_KEY',
	'N8N_REST_LOGIN_EMAIL',
	'N8N_REST_LOGIN_PASSWORD',
	'IT_MITTWALD_API_TOKEN',
	'IT_SERVER_ID',
] as const;

export type RequiredEnvVarName = (typeof requiredEnvVarNames)[number];

export interface IntegrationEnv {
	n8nBaseUrl: string;
	n8nApiKey: string;
	n8nApiBasePath: string;
	n8nRestBasePath: string;
	n8nBasicAuthUser?: string;
	n8nBasicAuthPassword?: string;
	n8nRestLoginEmail: string;
	n8nRestLoginPassword: string;
	n8nMittwaldCredentialId?: string;
	n8nMittwaldCredentialName: string;
	n8nMittwaldNodeType: string;
	n8nPollIntervalMs: number;
	n8nRunTimeoutMs: number;
	mittwaldApiToken: string;
	testServerId: string;
	inviteTarget?: string;
	inviteUserToken?: string;
}

export function hasIntegrationEnv(): boolean {
	loadDotEnv();
	return requiredEnvVarNames.every((name) => Boolean(env(name)));
}

export function getIntegrationEnv(): IntegrationEnv {
	loadDotEnv();
	const missingVars = requiredEnvVarNames.filter((name) => !env(name));
	if (missingVars.length > 0) {
		throw new Error(`Missing integration env vars: ${missingVars.join(', ')}`);
	}

	return {
		n8nBaseUrl: requiredEnv('N8N_BASE_URL'),
		n8nApiKey: requiredEnv('N8N_API_KEY'),
		n8nApiBasePath: env('N8N_API_BASE_PATH') ?? '/api/v1',
		n8nRestBasePath: env('N8N_REST_BASE_PATH') ?? '/rest',
		n8nBasicAuthUser: env('N8N_BASIC_AUTH_USER') ?? undefined,
		n8nBasicAuthPassword: env('N8N_BASIC_AUTH_PASSWORD') ?? undefined,
		n8nRestLoginEmail: requiredEnv('N8N_REST_LOGIN_EMAIL'),
		n8nRestLoginPassword: requiredEnv('N8N_REST_LOGIN_PASSWORD'),
		n8nMittwaldCredentialId: env('N8N_MITTWALD_CREDENTIAL_ID') ?? undefined,
		n8nMittwaldCredentialName: env('N8N_MITTWALD_CREDENTIAL_NAME') ?? 'mittwald-it',
		n8nMittwaldNodeType: env('N8N_MITTWALD_NODE_TYPE') ?? 'CUSTOM.mittwald',
		n8nPollIntervalMs: parsePositiveInt(env('N8N_POLL_INTERVAL_MS'), 1500),
		n8nRunTimeoutMs: parsePositiveInt(env('N8N_RUN_TIMEOUT_MS'), 120000),
		mittwaldApiToken: requiredEnv('IT_MITTWALD_API_TOKEN'),
		testServerId: requiredEnv('IT_SERVER_ID').trim(),
		inviteTarget: env('IT_INVITE_TARGET') ?? undefined,
		inviteUserToken: env('IT_INVITE_USER_TOKEN') ?? undefined,
	};
}

function requiredEnv(name: RequiredEnvVarName | string): string {
	const value = env(name);
	if (!value) {
		throw new Error(`Missing required env var: ${name}`);
	}

	return value;
}

function parsePositiveInt(rawValue: string | undefined, defaultValue: number): number {
	if (!rawValue) {
		return defaultValue;
	}

	const parsed = Number.parseInt(rawValue, 10);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error(`Expected a positive integer, but got "${rawValue}"`);
	}

	return parsed;
}
