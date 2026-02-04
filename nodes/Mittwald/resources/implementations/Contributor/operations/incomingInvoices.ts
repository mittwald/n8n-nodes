import { contributorResource } from '../resource';
import organisationProperty from '../../../operationProperties/organisationProperty';

export default contributorResource
	.addOperation({
		name: 'Get',
		action: 'Get incoming invoices',
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
