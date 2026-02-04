import { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { ApiClient } from '../../api/ApiClient';
import type { OperationPropertyConfig } from '../base';

// TODO: Helper class to config and map operation properties
const versionProperty: OperationPropertyConfig = {
	displayName: 'Version',
	name: 'version',
	type: 'resourceLocator',
	searchListMethod: 'searchVersion',
	default: '',
} satisfies OperationPropertyConfig;

export async function searchVersion(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	// TODO: Add support for pagination
	// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
	this.logger.info(
		'fetching versions for software (app) from mittwald API https://api.mittwald.de/v2/servers',
	);
	const appId = this.getCurrentNodeParameter('software') as { value: string };
	// @ts-ignore
	console.log('Current App ID:', appId);
	interface App {
		id: string;
		externalVersion: string;
	}

	const apiClient = new ApiClient(this);

	const versions = await apiClient.request<Array<App>>({
		path: `/apps/${appId.value}/versions`,
		method: 'GET',
		qs: {
			searchTerm: filter,
		},
	});

	// @ts-ignore
	console.log(versions);

	return {
		results: versions.map((version) => ({
			name: `${version.externalVersion}`,
			value: version.id,
		})),
	};
}

export default versionProperty;
