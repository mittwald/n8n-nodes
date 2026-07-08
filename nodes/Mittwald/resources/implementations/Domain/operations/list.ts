import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'List',
		action: 'List domains',
		description: 'Get a list of all domains',
	})
	.withProperties({})
	.withExecuteFn(async (context) => {
		const { apiClient } = context;

		return apiClient.request({
			path: `/domains`,
			method: 'GET',
		});
	});
