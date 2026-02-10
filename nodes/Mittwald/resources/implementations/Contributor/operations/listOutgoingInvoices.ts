import organisationProperty from '../../shared/organisationProperty';
import { contributorResource } from '../resource';

export default contributorResource
	.addOperation({
		name: 'listOutgoingInvoices',
		action: 'List outgoing invoices',
	})
	.withProperties({
		organisation: organisationProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { organisation } = properties;

		return apiClient.request({
			path: `/contributors/${organisation}/invoices/outgoing`,
			method: 'GET',
		});
	});
