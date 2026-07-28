import organisationProperty from '../../shared/organisationProperty';
import { organisationResource } from '../resource';
import Z from 'zod';

export default organisationResource
	.addOperation({
		name: 'Create Invite',
		action: 'Create an organisation invite',
		description: 'Invite a user to an organisation',
	})
	.withProperties({
		organisation: {
			...organisationProperty,
			required: true,
		},
		mailAddress: {
			displayName: 'Email Address',
			description: 'Email address of the person to invite',
			type: 'string',
			required: true,
			default: '',
		},
		role: {
			displayName: 'Role',
			description: 'Role the invited person receives in the organisation',
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
			description: 'Optional date on which the membership expires',
			type: 'dateTime',
			default: '',
			required: false,
		},
		message: {
			displayName: 'Message',
			description: 'Optional personal message included in the invitation email',
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
		const { organisation, mailAddress, role, membershipExpiresAt, message } = properties;

		return apiClient.request({
			path: `/customers/${organisation}/invites`,
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
