import { appResource } from '../resource';

export default appResource
	.addOperation({
		name: 'Get System Software Version',
		action: 'Get a system software version',
		description: 'Get details of a specific system software version',
	})
	.withProperties({
		systemSoftwareId: {
			displayName: 'System Software ID',
			type: 'string',
			default: '',
		},
		systemSoftwareVersionId: {
			displayName: 'System Software Version ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { systemSoftwareId, systemSoftwareVersionId } = properties;

		return apiClient.request({
			path: `/system-softwares/${systemSoftwareId}/versions/${systemSoftwareVersionId}`,
			method: 'GET',
		});
	});
