import { appResource } from '../resource';
import appInstallationProperty from '../../../operationProperties/appInstallationProperty';

export default appResource
	.addOperation({
		name: 'Remove',
		action: 'Delete AppInstallation',
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
