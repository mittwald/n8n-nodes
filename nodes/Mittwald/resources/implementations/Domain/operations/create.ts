import { domainResource } from '../resource';
import Z from 'zod';
import appInstallationProperty from '../../shared/appInstallationProperty';

const LIST_OF_SECOND_LEVEL_TLDS = [
	'co.uk',
	'org.uk',
	'me.uk',
	'co.at',
	'bz.it',
	'co.in',
	'co.nz',
	'com.au',
	'com.tw',
	'com.pl',
	'org.au',
	'de.com',
	'or.at',
	'org.il',
	'com.mx',
	'org.pl',
	'com.pt',
	'co.id',
	'cn.com',
	'ltd.uk',
	'co.jp',
	'firm.in',
	'gen.in',
	'ind.in',
	'org.in',
	'net.in',
	'co.za',
	'uk.com',
	'com.de',
	'co.hu',
	'ae.org',
	'co.nl',
	'com.co',
	'net.au',
	'id.au',
	'com.ph',
	'org.ph',
	'net.ph',
	'com.cm',
	'net.cm',
	'co.cm',
	'com.pe',
	'org.pe',
	'net.pe',
];

domainResource
	.addOperation({
		name: 'Create',
		action: 'Create and link subdomain',
		description: 'Create a subdomain and link it to an app installation',
	})
	.withProperties({
		fullName: {
			displayName: 'Full domain name',
			type: 'string',
			default: '',
		},
		targetInstallation: appInstallationProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { fullName, targetInstallation } = properties;

		const isSubdomain = fullName.split('.').length > 2;
		let baseDomain = fullName.split('.').slice(-2).join('.');
		if (LIST_OF_SECOND_LEVEL_TLDS.includes(baseDomain)) {
			baseDomain = fullName.split('.').slice(-3).join('.');
		}

		//TODO: allow to order domains with handles
		if (!isSubdomain) {
			throw new Error(
				'Only subdomains can be created. Please provide a full domain name including at least one subdomain.',
			);
		}

		// if baseDomain is 'project.space' skip the check because it is a default project domain
		if (baseDomain !== 'project.space') {
			try {
				await apiClient.request({
					method: 'GET',
					path: `/domains/${baseDomain}`,
					returnFullResponse: true,
				});
			} catch (e) {
				if (e.httpCode === 403) {
					throw new Error(
						'Domain does not exist. Please order the domain first before creating a subdomain. Ordering is not yet supported',
					);
				}
				throw e;
			}
		}

		const appInstallation = await apiClient.request({
			method: 'GET',
			path: `/app-installations/${targetInstallation}`,
			responseSchema: Z.object({
				id: Z.string(),
				projectId: Z.string(),
			}),
		});

		// create subdomain for already existing domain
		const ingress = await apiClient.request({
			path: `/ingresses/`,
			method: 'POST',
			responseSchema: Z.object({
				id: Z.string(),
			}),
			requestSchema: Z.object({
				projectId: Z.string(),
				hostname: Z.string(),
				paths: Z.array(
					Z.object({
						path: Z.string(),
						target: Z.object({ installationId: Z.string() }),
					}),
				),
			}),
			body: {
				projectId: appInstallation.projectId,
				hostname: fullName,
				paths: [{ path: '/', target: { installationId: targetInstallation } }],
			},
		});

		return apiClient.request({
			path: `/ingresses/${ingress.id}`,
			method: 'GET',
			polling: {
				waitUntil: {
					untilSuccess: true,
				},
				timeoutMs: 5000,
			},
		});
	});
