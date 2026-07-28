/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, testcase } from './testcase';

const readStringArray = (source: Record<string, unknown>, key: string): string[] => {
	const value = source[key];
	if (!Array.isArray(value)) {
		throw new Error(`Expected "${key}" to be an array`);
	}
	return value.filter((entry): entry is string => typeof entry === 'string');
};

integrationDescribe('Domain / Registry operations (integration)', () => {
	testcase(
		'creates an auth code and rewrites nameservers and owner contact',
		async (context) => {
			const domainName = context.env.domain;
			if (!domainName) {
				// Needs a domain registered on the test account; skip when unconfigured.
				return;
			}

			const listed = await context.mittwaldApi.domain.listDomains({});
			if (listed.status !== 200) {
				throw new Error(`Failed to list domains: ${listed.statusText}`);
			}
			const domain = listed.data.find((entry) => entry.domain === domainName);
			if (!domain) {
				throw new Error(`Domain "${domainName}" not found on the test account`);
			}
			const domainId = domain.domainId;

			const readDomain = async () => {
				const response = await context.mittwaldApi.domain.getDomain({ domainId });
				if (response.status !== 200) {
					throw new Error(`Failed to read domain: ${response.statusText}`);
				}
				return response.data;
			};

			const before = await readDomain();
			const originalNameservers = readStringArray(before, 'nameservers');
			expect(
				originalNameservers.length,
				'the domain needs at least two nameservers to restore',
			).toBeGreaterThanOrEqual(2);

			const ownerFields = before.handles?.ownerC?.current?.handleFields;
			if (!Array.isArray(ownerFields) || ownerFields.length === 0) {
				throw new Error('Expected the domain to expose owner contact handle fields');
			}

			// The nameservers and the owner contact are written back to their original
			// values. The auth code is the exception: the API has no way to revoke one,
			// so `hasAuthCode` stays true on the domain after this test.
			context.teardown(async () => {
				await context.runOperation({
					resource: 'Domain',
					operation: 'Update Nameservers',
					parameters: { domainId, nameservers: originalNameservers.join(', ') },
				});
			});

			const authCode = await context.runOperation({
				resource: 'Domain',
				operation: 'Create Auth Code',
				parameters: { domainId },
			});
			expect(authCode.items.length).toBeGreaterThan(0);

			// The current set is written back unchanged. Anything else is refused by the
			// registry's pre-delegation check (HTTP 400, reason PREDELEGATION) because the
			// nameservers have to answer for the domain already, and reordering is
			// normalised away — so an observable change cannot be produced from a test.
			const nameserversUpdated = await context.runOperation({
				resource: 'Domain',
				operation: 'Update Nameservers',
				parameters: { domainId, nameservers: originalNameservers.join(', ') },
			});
			expect(nameserversUpdated.items.length).toBeGreaterThan(0);

			const afterNameservers = await readDomain();
			expect(readStringArray(afterNameservers, 'nameservers')).toEqual(originalNameservers);

			// The owner contact is rewritten with the values it already has: the operation
			// is exercised without changing the registration. avoidEmailConfirmation stays
			// false so no 60-day transfer lock can be applied.
			const contactUpdated = await context.runOperation({
				resource: 'Domain',
				operation: 'Update Contact',
				parameters: {
					domainId,
					contact: 'owner',
					contactBody: JSON.stringify(ownerFields),
					avoidEmailConfirmation: false,
				},
			});
			expect(contactUpdated.items.length).toBeGreaterThan(0);
		},
		180_000,
	);
});
