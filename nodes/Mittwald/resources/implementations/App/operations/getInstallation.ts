import { appResource } from '../resource';
import appInstallationProperty from '../../shared/appInstallationProperty';

export default appResource
	.addOperation({
		name: 'Get Installation',
		action: 'Get an app installation',
		description: 'Get details of a specific app installation',
	})
	.withProperties({
		appInstallation: appInstallationProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { appInstallation } = properties;

		return apiClient.request({
			path: `/app-installations/${appInstallation}`,
			method: 'GET',
		});
	});
