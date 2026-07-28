import { appResource } from '../resource';
import appProperty from '../../shared/appProperty';
import appVersionProperty from '../../shared/appVersionProperty';

export default appResource
	.addOperation({
		name: 'Get Version',
		action: 'Get an app version',
		description: 'Get details of a specific app version',
	})
	.withProperties({
		app: {
			...appProperty,
			required: true,
		},
		version: {
			...appVersionProperty,
			required: true,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { app, version } = properties;

		return apiClient.request({
			path: `/apps/${app}/versions/${version}`,
			method: 'GET',
		});
	});
