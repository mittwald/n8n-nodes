import { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { ApiClient } from '../../api/ApiClient';
import type { OperationPropertyConfig } from '../base';

// TODO: Helper class to config and map operation properties
const serverProperty = {
	displayName: 'Server',
	name: 'server',
	type: 'resourceLocator',
	searchListMethod: 'searchServer',
	default: '',
} satisfies OperationPropertyConfig;

export async function searchServer(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	// TODO: Add support for pagination
	// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
	this.logger.info('fetching servers from mittwald API https://api.mittwald.de/v2/servers');

	interface Server {
		shortId: string;
		id: string;
		description: string;
	}

	const apiClient = new ApiClient(this);
	const servers = await apiClient.request<Array<Server>>({
		path: '/servers',
		method: 'GET',
		qs: {
			searchTerm: filter,
		},
	});

	return {
		results: servers.map((server) => ({
			name: `${server.description} (${server.shortId})`,
			value: server.id,
		})),
	};
}

export default serverProperty;
