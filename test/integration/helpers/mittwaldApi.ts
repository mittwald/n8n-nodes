/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { MittwaldAPIV2Client } from '@mittwald/api-client';

/**
 * The client prefixes every path with `/v2`, so it expects the bare origin
 * while the node's `MITTWALD_API_BASE_URL` carries the `/v2` suffix.
 */
const toClientBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/v2\/?$/, '/');

/**
 * Builds a mittwald API client that targets the same environment as the node
 * under test, so verification and teardown hit the environment the workflow
 * actually wrote to.
 */
export const createMittwaldApi = (token: string, baseUrl?: string): MittwaldAPIV2Client => {
	const client = MittwaldAPIV2Client.newWithToken(token);

	if (baseUrl) {
		client.axios.defaults.baseURL = toClientBaseUrl(baseUrl);
	}

	return client;
};
