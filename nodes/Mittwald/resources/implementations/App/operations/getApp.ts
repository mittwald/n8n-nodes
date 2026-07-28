import { appResource } from '../resource';
import appProperty from '../../shared/appProperty';

export default appResource
	.addOperation({
		name: 'Get App',
		action: 'Get an app',
		description: 'Get details of a specific app',
	})
	.withProperties({
		app: {
			...appProperty,
			required: true,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { app } = properties;

		return apiClient.request({
			path: `/apps/${app}`,
			method: 'GET',
		});
	});
