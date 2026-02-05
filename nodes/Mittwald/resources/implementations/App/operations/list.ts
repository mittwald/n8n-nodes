import { appResource } from '../resource';
import softwareProperty from '../../shared/softwareProperty';

export default appResource
	.addOperation({
		name: 'List All',
		action: 'List all installed Software (AppInstallations)',
	})
	.withProperties({
		software: softwareProperty,
	})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;
		const { software } = context.properties;

		const qs = software ? { appIds: software } : {};

		return apiClient.request({
			path: `/app-installations`,
			method: 'GET',
			qs,
		});
	});
