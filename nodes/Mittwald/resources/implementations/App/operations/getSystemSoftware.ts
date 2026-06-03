import { appResource } from '../resource';
import systemSoftwareLocatorProperty from '../../shared/systemSoftwareLocatorProperty';

export default appResource
	.addOperation({
		name: 'Get System Software',
		action: 'Get a system software',
		description: 'Get details of a specific system software',
	})
	.withProperties({
		systemSoftwareId: {
			...systemSoftwareLocatorProperty,
			required: true,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { systemSoftwareId } = properties;

		return apiClient.request({
			path: `/system-softwares/${systemSoftwareId}`,
			method: 'GET',
		});
	});
