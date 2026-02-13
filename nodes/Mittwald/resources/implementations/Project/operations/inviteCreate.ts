import z from 'zod';
import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Create Invite',
		action: 'Create an invite to a project',
		description: 'Create a project invitation',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		mailAddress: {
			displayName: 'Mail Address',
			type: 'string',
			required: true,
			default: '',
		},
		expirationDate: {
			displayName: 'Membership Expires At',
			type: 'dateTime',
			default: '',
			required: false,
		},
		message: {
			displayName: 'Message',
			type: 'string',
			default: '',
		},
		role: {
			displayName: 'Role',
			type: 'options',
			required: true,
			default: 'external',
			options: [
				{
					name: 'Owner',
					value: 'owner',
					description: 'Full access to all project areas',
				},
				{
					name: 'External',
					value: 'external',
					description: 'Access to project areas for hosting; no paid actions',
				},
				{
					name: 'Mail Administrator',
					value: 'emailadmin',
					description: 'Access only to email addresses and mailboxes',
				},
			],
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project, mailAddress, expirationDate: membershipExpiresAt, message, role } = properties;

		return apiClient.request({
			method: 'POST',
			path: `/projects/${project}/invites`,
			requestSchema: z.object({
				mailAddress: z.string().email(),
				role: z.enum(['owner', 'emailadmin', 'external']),
				membershipExpiresAt: z.string().optional(),
				message: z.string().optional(),
			}),
			body: {
				mailAddress,
				role,
				membershipExpiresAt: membershipExpiresAt
					? new Date(membershipExpiresAt).toISOString()
					: undefined,
				message,
			},
		});
	});
