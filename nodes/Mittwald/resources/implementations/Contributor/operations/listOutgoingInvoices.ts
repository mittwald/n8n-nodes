import organisationProperty from '../../shared/organisationProperty';
import { contributorResource } from '../resource';

export default contributorResource
	.addOperation({
		name: 'List Outgoing Invoices',
		action: 'List outgoing invoices',
		description: 'Get a list of outgoing invoices for an organisation',
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
