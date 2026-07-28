export const config = {
	apiBaseUrl: 'https://api.mittwald.de/v2',
	apiPaginationPageSize: 25,
	// Identifies this node in the mittwald API access logs. Without it, n8n sends
	// its generic outbound user agent ("n8n"), which is indistinguishable from any
	// other n8n node. Deliberately carries no version: reading it at runtime would
	// mean a file access, which verified community nodes are not allowed to do.
	userAgent: 'n8n-nodes-mittwald',
} as const;
