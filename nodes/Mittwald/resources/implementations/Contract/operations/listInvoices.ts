import organisationProperty from '../../shared/organisationProperty';
import { contractResource } from '../resource';

export default contractResource
	.addOperation({
		name: 'List Invoices',
		action: 'List invoices',
		description: 'Get a list of invoices for an organisation',
	})
	.withProperties({
		organisation: organisationProperty,
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { organisation } = properties;

		return apiClient.request({
			path: `/customers/${organisation}/invoices`,
			method: 'GET',
		});
	});
