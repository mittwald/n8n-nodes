import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Domain',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listIngresses',
	async searchListMethod(this, filter, paginationToken) {
		this.logger.info('fetching ingresses from mittwald API https://api.mittwald.de/v2/servers');

		const apiClient = new ApiClient(this);
		const response = await apiClient.request({
			path: '/ingresses',
			method: 'GET',
			responseSchema: Z.array(
				Z.object({
					hostname: Z.string(),
					id: Z.string(),
				}),
			),
			qs: {
				searchTerm: filter,
			},
			pagination: { token: paginationToken },
		});

		return {
			results: response.body.map((ingress) => ({
				name: `${ingress.hostname}`,
				value: ingress.id,
			})),
			paginationToken: response.nextPaginationToken,
		};
	},
} satisfies OperationPropertyConfig;
