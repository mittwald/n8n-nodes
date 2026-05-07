import { appResource } from '../resource';

export default appResource
	.addOperation({
		name: 'Get System Software',
		action: 'Get a system software',
		description: 'Get details of a specific system software',
	})
	.withProperties({
		systemSoftwareId: {
			displayName: 'System Software ID',
			type: 'string',
			default: '',
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
