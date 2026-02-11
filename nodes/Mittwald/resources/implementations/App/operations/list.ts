import { appResource } from '../resource';
import appProperty from '../../shared/appProperty';

export default appResource
	.addOperation({
		name: 'List',
		action: 'List all installed apps',
		description: 'Get a list of all installed apps',
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
