import { domainResource } from '../resource';
import Z from 'zod';
import projectProperty from '../../shared/projectProperty';
import appInstallationProperty from '../../shared/appInstallationProperty';

domainResource
	.addOperation({
		name: 'Create',
		action: 'Create and link subdomain',
		description: 'Create a subdomain and link it to an app installation',
	})
	.withProperties({
		project: projectProperty,
		fullName: {
			displayName: 'Full domain name',
			type: 'string',
			default: '',
		},
		targetInstallation: appInstallationProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { fullName, project, targetInstallation } = properties;

		const isSubdomain = fullName.split('.').length > 2;
		const baseDomain = isSubdomain ? fullName.split('.').slice(1).join('.') : fullName;

		const domain = await apiClient.request({
			method: 'GET',
			path: `/domains/${baseDomain}`,
			returnFullResponse: true,
		});

		//TODO: allow to order domains with handles
		if (domain.statusCode !== 200) {
			throw new Error(
				'Domain does not exist. Please order the domain first before creating a subdomain. Ordering is not yet supported',
			);
		}

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
				projectId: project,
				hostname: fullName,
				paths: [{ path: '/', target: { installationId: targetInstallation } }],
			},
		});

		return apiClient.request({
			path: `/ingresses/${ingress.id}`,
			method: 'GET',
			polling: {
				waitUntil: {
					status: 200,
				},
				timeoutMs: 5000,
			},
		});
	});
