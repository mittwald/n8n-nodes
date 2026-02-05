import { appResource } from '../resource';
import Z from 'zod';
import appInstallationProperty from '../../shared/appInstallationProperty';
import systemSoftwareProperty from '../../shared/systemSoftwareProperty';

export default appResource
	.addOperation({
		name: 'Update System Software',
		action: 'Update System Software',
	})
	.withProperties({
		appInstallation: appInstallationProperty,
		systemSoftware: systemSoftwareProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { appInstallation } = properties;

		// @ts-ignore
		console.log(properties.systemSoftware);

		const appInstallationResponse = null;
		/*
		await apiClient.request({
			method: 'PATCH',
			path: '/app-installations/' + appInstallation,
			requestSchema: Z.object({}),
			responseSchema: Z.object({
				id: Z.string(),
			}),
			body: {},
		});
*/
		return appInstallationResponse;
	});
