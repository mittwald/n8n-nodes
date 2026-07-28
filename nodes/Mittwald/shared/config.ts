/* eslint-disable @n8n/community-nodes/no-restricted-globals */
// The base URL is overridable so the integration suite can run against a
// non-production mittwald environment. Unset — as on n8n Cloud, where the
// variable cannot be provided — this resolves to production.
const apiBaseUrlOverride = process.env.MITTWALD_API_BASE_URL?.trim();

export const config = {
	apiBaseUrl:
		apiBaseUrlOverride && apiBaseUrlOverride.length > 0
			? apiBaseUrlOverride
			: 'https://api.mittwald.de/v2',
	apiPaginationPageSize: 25,
} as const;
