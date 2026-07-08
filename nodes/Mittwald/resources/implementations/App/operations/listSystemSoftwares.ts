import { appResource } from '../resource';

export default appResource
	.addOperation({
		name: 'List System Softwares',
		action: 'List system softwares',
		description: 'Get a list of available system software packages',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/system-softwares`,
			method: 'GET',
		});
	});
