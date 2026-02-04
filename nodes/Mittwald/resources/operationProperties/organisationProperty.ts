import { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { ApiClient } from '../../api/ApiClient';
import type { OperationPropertyConfig } from '../base';

// TODO: Helper class to config and map operation properties
const organisationProperty = {
	displayName: 'Organisation',
	name: 'organisation',
	type: 'resourceLocator',
	searchListMethod: 'searchOrganisation',
	default: '',
} satisfies OperationPropertyConfig;

export async function searchOrganisation(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	// TODO: Add support for pagination
	// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
	this.logger.info('fetching organisations from mittwald API https://api.mittwald.de/v2/servers');

	interface Organisation {
		shortId: string;
		id: string;
		description: string;
	}

	const apiClient = new ApiClient(this);
	const organisations = await apiClient.request<Array<Organisation>>({
		path: '/customers',
		method: 'GET',
		qs: {
			searchTerm: filter,
		},
	});

	return {
		results: organisations.map((organisation) => ({
			name: `${organisation.description} (${organisation.shortId})`,
			value: organisation.id,
		})),
	};
}

export default organisationProperty;
