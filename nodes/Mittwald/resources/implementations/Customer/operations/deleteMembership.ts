import { customerResource } from '../resource';

export default customerResource
	.addOperation({
		name: 'Delete Membership',
		action: 'Delete a customer membership',
		description: 'Remove a member from a customer organisation',
	})
	.withProperties({
		customerMembershipId: {
			displayName: 'Customer Membership ID',
			type: 'string',
			required: true,
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { customerMembershipId } = properties;

		return apiClient.request({
			path: `/customer-memberships/${customerMembershipId}`,
			method: 'DELETE',
		});
	});
