import organisationProperty from '../../shared/organisationProperty';
import { contributorResource } from '../resource';

export default contributorResource
	.addOperation({
		name: 'List Contract Partners',
		action: 'List contract partners of a contributor',
		description: 'Get a list of contract partners associated with a contributor',
	})
	.withProperties({
		organisation: {
			...organisationProperty,
			required: true,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { organisation } = properties;

		return apiClient.request({
			path: `/contributors/${organisation}/contract-partners`,
			method: 'GET',
		});
	});
