import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

export default {
	displayName: 'Domain',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listIngresses',
	async searchListMethod(this, filter, paginationToken) {
		this.logger.info('fetching ingresses from mittwald API https://api.mittwald.de/v2/servers');

		interface Ingress {
			hostname: string;
			id: string;
		}

		const apiClient = new ApiClient(this);
		const response = await apiClient.request<Array<Ingress>>({
			path: '/ingresses',
			method: 'GET',
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
