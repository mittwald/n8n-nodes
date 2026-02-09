import { appResource } from '../resource';
import appProperty from '../../shared/appProperty';

export default appResource
	.addOperation({
		name: 'List All',
		action: 'List all installed apps',
	})
	.withProperties({
		software: appProperty,
	})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;
		const { software } = context.properties;

		const qs = software ? { appIds: [software] } : {};

		return apiClient.request({
			path: `/app-installations`,
			method: 'GET',
			qs,
		});
	});
