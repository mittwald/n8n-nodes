import { mailResource } from '../resource';
import Z from 'zod';

export default mailResource
	.addOperation({
		name: 'Update Mail Address Autoresponder',
		action: 'Update a mail address auto responder',
		description: 'Update the auto responder configuration of a mail address',
	})
	.withProperties({
		mailAddressId: {
			displayName: 'Mail Address ID',
			type: 'string',
			required: true,
			default: '',
			description: 'The unique identifier of the mail address',
		},
		active: {
			displayName: 'Active',
			type: 'boolean',
			default: false,
			description: 'Whether the auto responder should be enabled',
		},
		message: {
			displayName: 'Message',
			type: 'string',
			required: true,
			default: '',
			description: 'Message body to send as auto-reply',
		},
		startsAt: {
			displayName: 'Starts At',
			type: 'dateTime',
			default: '',
			description: 'Optional date and time when the auto responder becomes active',
		},
		expiresAt: {
			displayName: 'Expires At',
			type: 'dateTime',
			default: '',
			description: 'Optional date and time when the auto responder is disabled',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { mailAddressId, active, message, startsAt, expiresAt } = properties;

		// The API takes the settings wrapped in an `autoResponder` object.
		const autoResponder: Record<string, unknown> = {
			active,
			message,
		};

		if (startsAt.length > 0) {
			autoResponder.startsAt = startsAt;
		}

		if (expiresAt.length > 0) {
			autoResponder.expiresAt = expiresAt;
		}

		return apiClient.request({
			path: `/mail-addresses/${mailAddressId}/autoresponder`,
			method: 'PATCH',
			requestSchema: Z.object({
				autoResponder: Z.object({
					active: Z.boolean(),
					message: Z.string(),
					startsAt: Z.string().optional(),
					expiresAt: Z.string().optional(),
				}),
			}),
			body: { autoResponder },
		});
	});
