import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

// TODO: Helper class to config and map operation properties
export default {
	displayName: 'AppInstallation',
	type: 'resourceLocator',
	searchListMethodName: 'searchAppInstallation',
	async searchListMethod(this, filter) {
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
	},
	default: '',
} satisfies OperationPropertyConfig;
