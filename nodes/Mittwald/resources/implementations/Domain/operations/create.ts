import { domainResource } from '../resource';
import Z from 'zod';
import appInstallationProperty from '../../shared/appInstallationProperty';

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
		let baseDomain = isSubdomain ? fullName.split('.').slice(1).join('.') : fullName;

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
