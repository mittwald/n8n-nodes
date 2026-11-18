import { appResource } from '../resource';

export default appResource
	.addOperation({
		name: 'List System Softwares',
		action: 'List system softwares',
		description: 'Get a list of available system software packages',
		paginated: true,
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.requestList({
			path: `/system-softwares`,
			pagination: context.pagination,
		});
	});
