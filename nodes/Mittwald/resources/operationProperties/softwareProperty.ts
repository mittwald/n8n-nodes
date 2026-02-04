import { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { ApiClient } from '../../api/ApiClient';
import type { OperationPropertyConfig } from '../base';

// TODO: Helper class to config and map operation properties
const softwareProperty: OperationPropertyConfig = {
	displayName: 'Software (apps)',
	name: 'software',
	type: 'resourceLocator',
	searchListMethod: 'searchSoftware',
	default: '',
} satisfies OperationPropertyConfig;

export async function searchSoftware(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	// TODO: Add support for pagination
	// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
	this.logger.info('fetching software (apps) from mittwald API https://api.mittwald.de/v2/servers');

	interface App {
		name: string;
		id: string;
		tags: string[];
	}

	const apiClient = new ApiClient(this);
	const apps = await apiClient.request<Array<App>>({
		path: '/apps',
		method: 'GET',
		qs: {
			searchTerm: filter,
		},
	});

	// @ts-ignore
	console.log(apps);

	return {
		results: apps.map((app) => ({
			name: `${app.name}`,
			value: app.id,
		})),
	};
}

export default softwareProperty;
