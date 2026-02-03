import { OperationPropertyConfig } from '../OperationProperty';
import { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

const server: OperationPropertyConfig = {
	name: 'server',
	displayName: 'Server',
	type: 'resourceLocator',
	searchListMethod: 'searchServer',
	default: null,
};

export async function searchServer(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	// TODO: Add support for pagination
	// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
	this.logger.info('fetching servers from mittwald API https://api.mittwald.de/v2/servers');

	const servers = await this.helpers.httpRequestWithAuthentication.call(this, 'mittwaldApi', {
		url: 'https://api.mittwald.de/v2/servers',
		json: true,
		method: 'GET',
		qs: {
			searchTerm: filter,
		},
	});

	return {
		results: servers.map((server: any) => ({
			name: `${server.description} (${server.shortId})`,
			value: server.id,
		})),
	};
}

export default server;
