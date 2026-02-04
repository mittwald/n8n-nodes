import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

// TODO: Helper class to config and map operation properties
export default {
	displayName: 'Organisation',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'searchOrganisation',
	async searchListMethod(this, filter) {
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
	},
} satisfies OperationPropertyConfig;
