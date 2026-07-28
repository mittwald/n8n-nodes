import { organisationResource } from '../resource';

export default organisationResource
	.addOperation({
		name: 'Delete Membership',
		action: 'Delete an organisation membership',
		description: 'Remove a member from an organisation',
	})
	.withProperties({
		customerMembershipId: {
			displayName: 'Membership ID',
			description: 'The unique identifier of the organisation membership',
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
