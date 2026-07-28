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
	// Identifies this node in the mittwald API access logs. Without it, n8n sends
	// its generic outbound user agent ("n8n"), which is indistinguishable from any
	// other n8n node. Deliberately carries no version: reading it at runtime would
	// mean a file access, which verified community nodes are not allowed to do.
	userAgent: 'n8n-nodes-mittwald',
} as const;
