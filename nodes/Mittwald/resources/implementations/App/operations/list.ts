import { appResource } from '../resource';
import appProperty from '../../shared/appProperty';

export default appResource
	.addOperation({
		name: 'List',
		action: 'List all installed apps',
		description: 'Get a list of all installed apps',
		paginated: true,
	})
	.withProperties({
		app: appProperty,
	})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;
		const { app } = context.properties;

		const qs = app ? { appIds: [app] } : {};

		return apiClient.requestList({
			path: `/app-installations`,
			qs,
			pagination: context.pagination,
		});
	});
