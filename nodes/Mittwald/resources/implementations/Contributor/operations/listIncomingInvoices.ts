import organisationProperty from '../../shared/organisationProperty';
import { contributorResource } from '../resource';

export default contributorResource
	.addOperation({
		name: 'List Incoming Invoices',
		action: 'List incoming invoices',
		description: 'Get a list of incoming invoices for an organisation',
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
			path: `/contributors/${organisation}/invoices/incoming`,
			pagination: context.pagination,
		});
	});
