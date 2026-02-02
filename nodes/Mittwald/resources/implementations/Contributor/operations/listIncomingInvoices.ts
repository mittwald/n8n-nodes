import organisationProperty from '../../shared/organisationProperty';
import { contributorResource } from '../resource';

export default contributorResource
	.addOperation({
		name: 'List incoming invoices',
		action: 'list incoming invoices',
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
