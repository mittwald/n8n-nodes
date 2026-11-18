import organisationProperty from '../../shared/organisationProperty';
import { contractResource } from '../resource';

export default contractResource
	.addOperation({
		name: 'List Invoices',
		action: 'List invoices',
		description: 'Get a list of invoices for an organisation',
		paginated: true,
	})
	.withProperties({
		organisation: {
			...organisationProperty,
			required: true,
		},
	})
	.withExecuteFn(async ({ properties, apiClient, pagination }) => {
		const { organisation } = properties;

		return apiClient.requestList({
			path: `/customers/${organisation}/invoices`,
			pagination,
		});
	});
