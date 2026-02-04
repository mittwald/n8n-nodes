import { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { ApiClient } from '../../api/ApiClient';
import type { OperationPropertyConfig } from '../base';

// TODO: Helper class to config and map operation properties
const appInstallationProperty = {
	displayName: 'AppInstallation',
	name: 'appInstallation',
	type: 'resourceLocator',
	searchListMethod: 'searchAppInstallation',
	default: '',
} satisfies OperationPropertyConfig;

export async function searchAppInstallation(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	// TODO: Add support for pagination
	// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
	this.logger.info(
		'fetching appInstallations from mittwald API https://api.mittwald.de/v2/servers',
	);

	interface AppInstallation {
		shortId: string;
		id: string;
		description: string;
	}

	const apiClient = new ApiClient(this);
	const appInstallations = await apiClient.request<Array<AppInstallation>>({
		path: '/app-installations',
		method: 'GET',
		qs: {
			searchTerm: filter,
		},
	});

	return {
		results: appInstallations.map((appInstalltion) => ({
			name: `${appInstalltion.description} (${appInstalltion.shortId})`,
			value: appInstalltion.id,
		})),
	};
}

export default appInstallationProperty;
