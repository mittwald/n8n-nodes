import { appResource } from '../resource';
import appProperty from '../../shared/appProperty';

export default appResource
	.addOperation({
		name: 'List All',
		action: 'List all installed apps',
	})
	.withProperties({
		app: appProperty,
	})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;
		const { app } = context.properties;

		const qs = app ? { appIds: [app] } : {};

		return apiClient.request({
			path: `/app-installations`,
			method: 'GET',
			qs,
		});
	});
