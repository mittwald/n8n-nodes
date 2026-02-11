import organisationProperty from '../../shared/organisationProperty';
import { contributorResource } from '../resource';

export default contributorResource
	.addOperation({
		name: 'List Incoming Invoices',
		action: 'List incoming invoices',
		description: 'Get a list of incoming invoices for an organisation',
	})
	.withProperties({
		organisation: organisationProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { organisation } = properties;

		return apiClient.request({
			path: `/contributors/${organisation}/invoices/incoming`,
			method: 'GET',
		});
	});
