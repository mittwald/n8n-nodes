import { appResource } from '../resource';
import appProperty from '../../shared/appProperty';

export default appResource
	.addOperation({
		name: 'List Versions',
		action: 'List app versions',
		description: 'Get a list of available versions for an app',
	})
	.withProperties({
		app: appProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { app } = properties;

		return apiClient.request({
			path: `/apps/${app}/versions`,
			method: 'GET',
		});
	});
