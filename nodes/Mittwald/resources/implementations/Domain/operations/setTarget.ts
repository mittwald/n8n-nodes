import { domainResource } from '../resource';
import Z from 'zod';
import appInstallationProperty from '../../shared/appInstallationProperty';
import ingressesProperty from '../../shared/ingressesProperty';

domainResource
	.addOperation({
		name: 'Change Domain Target',
		action: 'Change Target Installation for Domain',
	})
	.withProperties({
		ingress: ingressesProperty,
		targetInstallation: appInstallationProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { ingress, targetInstallation } = properties;

		await apiClient.request({
			path: `/ingresses/${ingress}/paths`,
			method: 'PATCH',
			requestSchema: Z.array(
				Z.object({
					path: Z.string(),
					target: Z.object({ installationId: Z.string() }),
				}),
			),
			body: [
				{
					path: '/',
					target: { installationId: targetInstallation },
				},
			],
		});

		return {};
	});
