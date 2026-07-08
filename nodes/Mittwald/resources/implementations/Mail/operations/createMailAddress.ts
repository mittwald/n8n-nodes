import projectProperty from '../../shared/projectProperty';
import { mailResource } from '../resource';
import Z from 'zod';

export default mailResource
	.addOperation({
		name: 'Create Mail Address',
		action: 'Create a mail address',
		description: 'Create a new mail address in a project',
	})
	.withProperties({
		project: projectProperty,
		address: {
			displayName: 'Address',
			type: 'string',
			required: true,
			default: '',
			description: 'The full mail address (e.g. info@example.com)',
		},
		password: {
			displayName: 'Password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Password used to authenticate against the mailbox. Leave empty to skip.',
		},
		quotaInBytes: {
			displayName: 'Quota in Bytes',
			type: 'number',
			default: 0,
			description: 'Mailbox quota in bytes. Set to 0 to use the project default.',
		},
		forwardAddresses: {
			displayName: 'Forward Addresses',
			type: 'string',
			default: '',
			description: 'Optional comma- or newline-separated list of forward target addresses',
		},
		catchAll: {
			displayName: 'Catch-All',
			type: 'boolean',
			default: false,
			description:
				'Whether this address should receive mail for all unknown local parts on its domain',
		},
		enableSpamProtection: {
			displayName: 'Enable Spam Protection',
			type: 'boolean',
			default: true,
			description: 'Whether spam protection should be enabled for this address',
		},
		autoResponderActive: {
			displayName: 'Auto Responder Active',
			type: 'boolean',
			default: false,
			description: 'Whether the auto responder should be enabled',
		},
		autoResponderMessage: {
			displayName: 'Auto Responder Message',
			type: 'string',
			default: '',
			description: 'Message body to send as auto-reply',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const {
			project,
			address,
			password,
			quotaInBytes,
			forwardAddresses,
			catchAll,
			enableSpamProtection,
			autoResponderActive,
			autoResponderMessage,
		} = properties;

		const parsedForwardAddresses = forwardAddresses
			.split(/\n|,/)
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0);

		const body: Record<string, unknown> = {
			address,
			isCatchAll: catchAll,
			enableSpamProtection,
		};

		if (password.length > 0) {
			body.password = password;
		}

		if (quotaInBytes > 0) {
			body.quotaInBytes = quotaInBytes;
		}

		if (parsedForwardAddresses.length > 0) {
			body.forwardAddresses = parsedForwardAddresses;
		}

		if (autoResponderActive) {
			body.autoResponder = {
				active: true,
				message: autoResponderMessage,
			};
		}

		return apiClient.request({
			path: `/projects/${project}/mail-addresses`,
			method: 'POST',
			requestSchema: Z.object({
				address: Z.string().min(1),
				password: Z.string().optional(),
				quotaInBytes: Z.number().int().positive().optional(),
				forwardAddresses: Z.array(Z.string()).optional(),
				isCatchAll: Z.boolean().optional(),
				enableSpamProtection: Z.boolean().optional(),
				autoResponder: Z
					.object({
						active: Z.boolean(),
						message: Z.string().optional(),
					})
					.optional(),
			}),
			body,
		});
	});
