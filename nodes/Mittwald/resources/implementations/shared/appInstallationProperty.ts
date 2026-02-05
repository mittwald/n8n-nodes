import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'AppInstallation',
	type: 'resourceLocator',
	searchListMethodName: 'searchAppInstallation',
	async searchListMethod(this, filter, paginationToken) {
		const apiClient = new ApiClient(this);

		const response = await apiClient.request({
			path: '/app-installations',
			method: 'GET',
			qs: {
				searchTerm: filter,
			},
			pagination: { token: paginationToken },
			responseSchema: Z.array(
				Z.object({
					shortId: Z.string(),
					id: Z.string(),
					description: Z.string(),
				}),
			),
		});

		return {
			results: response.body.map((appInstalltion) => ({
				name: `${appInstalltion.description} (${appInstalltion.shortId})`,
				value: appInstalltion.id,
			})),
			paginationToken: response.nextPaginationToken,
		};
	},
	default: '',
} satisfies OperationPropertyConfig;
