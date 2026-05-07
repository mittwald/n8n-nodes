import { appResource } from '../resource';

export default appResource
	.addOperation({
		name: 'List System Software Versions',
		action: 'List system software versions',
		description: 'Get a list of versions for a system software',
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
			path: `/system-softwares/${systemSoftwareId}/versions`,
			method: 'GET',
		});
	});
