import organisationProperty from '../../shared/organisationProperty';
import { contributorResource } from '../resource';

export default contributorResource
	.addOperation({
		name: 'List Contract Partners',
		action: 'List contract partners of a contributor',
		description: 'Get a list of contract partners associated with a contributor',
		paginated: true,
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

		return apiClient.requestList({
			path: `/contributors/${organisation}/contract-partners`,
			pagination: context.pagination,
		});
	});
