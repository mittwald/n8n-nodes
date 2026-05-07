import customerProperty from '../../shared/customerProperty';
import { customerResource } from '../resource';
import Z from 'zod';

export default customerResource
	.addOperation({
		name: 'Create Invite',
		action: 'Create a customer invite',
		description: 'Invite a user to a customer organisation',
	})
	.withProperties({
		customer: {
			...customerProperty,
			required: true,
		},
		mailAddress: {
			displayName: 'Email Address',
			type: 'string',
			required: true,
			default: '',
		},
		role: {
			displayName: 'Role',
			type: 'options',
			required: true,
			default: 'member',
			options: [
				{
					name: 'Owner',
					value: 'owner',
				},
				{
					name: 'Member',
					value: 'member',
				},
				{
					name: 'Accountant',
					value: 'accountant',
				},
				{
					name: 'Not Set',
					value: 'notset',
				},
			],
		},
		membershipExpiresAt: {
			displayName: 'Membership Expires At',
			type: 'dateTime',
			default: '',
			required: false,
		},
		message: {
			displayName: 'Message',
			type: 'string',
			default: '',
			required: false,
			typeOptions: {
				rows: 3,
			},
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { customer, mailAddress, role, membershipExpiresAt, message } = properties;

		return apiClient.request({
			path: `/customers/${customer}/invites`,
			method: 'POST',
			requestSchema: Z.object({
				mailAddress: Z.string().email(),
				role: Z.enum(['notset', 'owner', 'member', 'accountant']),
				membershipExpiresAt: Z.string().optional(),
				message: Z.string().optional(),
			}),
			body: {
				mailAddress,
				role,
				membershipExpiresAt: membershipExpiresAt
					? new Date(membershipExpiresAt).toISOString()
					: undefined,
				message: message || undefined,
			},
		});
	});
