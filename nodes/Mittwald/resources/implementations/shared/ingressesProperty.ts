import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

export default {
	displayName: 'Domain',
	type: 'resourceLocator',
	default: '',
	searchListMethodName: 'listIngresses',
	async searchListMethod(this, filter) {
		// TODO: Add support for pagination
		// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
		this.logger.info('fetching ingresses from mittwald API https://api.mittwald.de/v2/servers');

		interface Ingress {
			hostname: string;
			id: string;
		}

		const apiClient = new ApiClient(this);
		const servers = await apiClient.request<Array<Ingress>>({
			path: '/ingresses',
			method: 'GET',
			qs: {
				searchTerm: filter,
			},
		});

		return {
			results: servers.map((ingress) => ({
				name: `${ingress.hostname}`,
				value: ingress.id,
			})),
		};
	},
} satisfies OperationPropertyConfig;
