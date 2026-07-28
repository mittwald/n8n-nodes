/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { config } from 'dotenv';
import Z from 'zod';

/* eslint-disable @n8n/community-nodes/no-restricted-globals */
const processEnv = process.env;

const dotenvError = config({ quiet: true }).error as { code?: string } | undefined;
if (dotenvError && dotenvError.code !== 'ENOENT') {
	throw dotenvError;
}

const emptyStringToUndefined = (value: unknown) =>
	typeof value === 'string' && value.trim() === '' ? undefined : value;

/**
 * `.env.example` ships placeholders. Left in place they are truthy, so a test
 * that means to skip would instead run against a nonsense value and fail with
 * a confusing API error. Treat them as unset.
 */
const isPlaceholder = (value: string) => value.startsWith('TO_BE_SET') || value === '1234';

const unsetOrPlaceholderToUndefined = (value: unknown) => {
	const normalised = emptyStringToUndefined(value);
	return typeof normalised === 'string' && isPlaceholder(normalised.trim())
		? undefined
		: normalised;
};

const requiredString = Z.string().trim().min(1);
const optionalString = Z.preprocess(unsetOrPlaceholderToUndefined, Z.string().trim().optional());
const positiveInt = Z.preprocess(
	emptyStringToUndefined,
	Z.coerce.number().int().positive().optional(),
);

const integrationEnvSourceSchema = Z.object({
	N8N_BASE_URL: requiredString,
	N8N_API_KEY: requiredString,
	N8N_API_BASE_PATH: optionalString.default('/api/v1'),
	N8N_REST_BASE_PATH: optionalString.default('/rest'),
	N8N_REST_LOGIN_EMAIL: requiredString,
	N8N_REST_LOGIN_PASSWORD: requiredString,
	N8N_MITTWALD_CREDENTIAL_ID: optionalString,
	N8N_MITTWALD_CREDENTIAL_NAME: optionalString.default('mittwald-it'),
	N8N_MITTWALD_NODE_TYPE: optionalString.default('CUSTOM.mittwald'),
	N8N_POLL_INTERVAL_MS: positiveInt.default(1500),
	N8N_RUN_TIMEOUT_MS: positiveInt.default(300000),
	IT_MITTWALD_API_TOKEN: requiredString,
	IT_SERVER_ID: requiredString,
	MITTWALD_API_BASE_URL: optionalString,
	IT_INVITE_TARGET: optionalString,
	IT_INVITE_USER_TOKEN: optionalString,
	IT_DNS_PARENT_ZONE_ID: optionalString,
	IT_CUSTOMER_ID: optionalString,
	IT_DOMAIN: optionalString,
	IT_EXPENDABLE_DOMAIN: optionalString,
	IT_DELETABLE_DOMAIN: optionalString,
	IT_REMOVABLE_MEMBER_MAIL: optionalString,
});

const requiredIntegrationEnvSchema = integrationEnvSourceSchema.pick({
	N8N_BASE_URL: true,
	N8N_API_KEY: true,
	N8N_REST_LOGIN_EMAIL: true,
	N8N_REST_LOGIN_PASSWORD: true,
	IT_MITTWALD_API_TOKEN: true,
	IT_SERVER_ID: true,
});

const integrationEnvSchema = integrationEnvSourceSchema.transform((env) => ({
	n8nBaseUrl: env.N8N_BASE_URL,
	n8nApiKey: env.N8N_API_KEY,
	n8nApiBasePath: env.N8N_API_BASE_PATH,
	n8nRestBasePath: env.N8N_REST_BASE_PATH,
	n8nRestLoginEmail: env.N8N_REST_LOGIN_EMAIL,
	n8nRestLoginPassword: env.N8N_REST_LOGIN_PASSWORD,
	n8nMittwaldCredentialId: env.N8N_MITTWALD_CREDENTIAL_ID,
	n8nMittwaldCredentialName: env.N8N_MITTWALD_CREDENTIAL_NAME,
	n8nMittwaldNodeType: env.N8N_MITTWALD_NODE_TYPE,
	n8nPollIntervalMs: env.N8N_POLL_INTERVAL_MS,
	n8nRunTimeoutMs: env.N8N_RUN_TIMEOUT_MS,
	mittwaldApiToken: env.IT_MITTWALD_API_TOKEN,
	mittwaldApiBaseUrl: env.MITTWALD_API_BASE_URL,
	testServerId: env.IT_SERVER_ID,
	inviteTarget: env.IT_INVITE_TARGET,
	inviteUserToken: env.IT_INVITE_USER_TOKEN,
	dnsParentZoneId: env.IT_DNS_PARENT_ZONE_ID,
	customerId: env.IT_CUSTOMER_ID,
	domain: env.IT_DOMAIN,
	expendableDomain: env.IT_EXPENDABLE_DOMAIN,
	deletableDomain: env.IT_DELETABLE_DOMAIN,
	removableMemberMail: env.IT_REMOVABLE_MEMBER_MAIL,
}));

export type IntegrationEnv = Z.infer<typeof integrationEnvSchema>;

export const hasIntegrationEnv = (): boolean =>
	requiredIntegrationEnvSchema.safeParse(processEnv).success;

export const getIntegrationEnv = (): IntegrationEnv => integrationEnvSchema.parse(processEnv);
