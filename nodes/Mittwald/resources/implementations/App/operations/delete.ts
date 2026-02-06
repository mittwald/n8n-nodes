import appInstallationProperty from '../../shared/appInstallationProperty';
import { appResource } from '../resource';

export default appResource
	.addOperation({
		name: 'Uninstall',
		action: 'Uninstall an app',
	})
	.withProperties({
		appInstallation: appInstallationProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { appInstallation } = properties;

		return await apiClient.request({
			path: `/app-installations/${appInstallation}`,
			method: 'DELETE',
		});
	});
