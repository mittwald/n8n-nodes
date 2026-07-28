import projectProperty from '../../shared/projectProperty';
import { mailResource } from '../resource';
import Z from 'zod';

const defaultQuotaInBytes = 2147483648;

export default mailResource
	.addOperation({
		name: 'Create Mail Address',
		action: 'Create a mail address',
		description: 'Create a new mail address in a project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
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
			description:
				'Password of the mailbox. Leave empty to create an address that only forwards mail.',
		},
		quotaInBytes: {
			displayName: 'Quota in Bytes',
			type: 'number',
			default: defaultQuotaInBytes,
			description:
				'Mailbox quota in bytes, or -1 for no limit. Only used when a password is set.',
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
		} = properties;

		const parsedForwardAddresses = forwardAddresses
			.split(/\n|,/)
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0);

		// Workflows built before the quota became mandatory carry a 0 here, which
		// the API does not accept. -1 is its value for an unlimited mailbox.
		const mailboxQuotaInBytes = quotaInBytes === 0 ? defaultQuotaInBytes : quotaInBytes;

		const path = `/projects/${project}/mail-addresses`;

		// The API takes either a mailbox or a pure forwarding address, and the
		// mailbox settings belong into their own object.
		if (password.length === 0) {
			if (parsedForwardAddresses.length === 0) {
				throw new Error(
					'A mail address needs either a password for its mailbox or at least one forward address',
				);
			}

			return apiClient.request({
				path,
				method: 'POST',
				requestSchema: Z.object({
					address: Z.string().min(1),
					forwardAddresses: Z.array(Z.string().min(1)).min(1),
				}),
				body: {
					address,
					forwardAddresses: parsedForwardAddresses,
				},
			});
		}

		return apiClient.request({
			path,
			method: 'POST',
			requestSchema: Z.object({
				address: Z.string().min(1),
				isCatchAll: Z.boolean(),
				mailbox: Z.object({
					password: Z.string().min(1),
					quotaInBytes: Z.number().int().min(-1),
					enableSpamProtection: Z.boolean(),
				}),
				forwardAddresses: Z.array(Z.string().min(1)).optional(),
			}),
			body: {
				address,
				isCatchAll: catchAll,
				mailbox: {
					password,
					quotaInBytes: mailboxQuotaInBytes,
					enableSpamProtection,
				},
				forwardAddresses:
					parsedForwardAddresses.length > 0 ? parsedForwardAddresses : undefined,
			},
		});
	});
