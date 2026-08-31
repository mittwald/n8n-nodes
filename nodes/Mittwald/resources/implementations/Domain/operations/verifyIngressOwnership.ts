import { domainResource } from '../resource';
import Z from 'zod';
import { NodeApiError } from 'n8n-workflow';

export default domainResource
	.addOperation({
		name: 'Verify Ingress Ownership',
		action: 'Verify ingress ownership',
		description:
			'Check whether the DNS TXT record proving ownership of an ingress is in place. While the proof is missing the operation reports verified false together with the TXT record that still has to be published, so a workflow can branch on it instead of failing. An ingress whose domain is managed in this account is verified from the start.',
	})
	.withProperties({
		ingressId: {
			displayName: 'Ingress ID',
			description: 'The unique identifier of the ingress',
			type: 'string',
			default: '',
			required: true,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient, node } = context;
		const { ingressId } = properties;

		try {
			await apiClient.request({
				path: `/ingresses/${ingressId}/actions/verify-ownership`,
				method: 'POST',
			});

			return { ingressId, verified: true };
		} catch (error) {
			// 412 is how the API reports a missing TXT proof. That is an outcome, not a
			// failure — mstudio maps it to `false` as well — so report it as a result and
			// hand back the record the user still has to publish.
			// n8n reports the status as a string, so compare numerically.
			if (Number(error.httpCode) !== 412) {
				throw new NodeApiError(node.getNode(), error);
			}

			// A 412 covers two situations: the TXT proof is still missing, or the ingress
			// is already verified and there is no challenge left to check. Read the
			// ingress rather than assuming the first one.
			const ingress = await apiClient.request({
				path: `/ingresses/${ingressId}`,
				method: 'GET',
				responseSchema: Z.object({
					hostname: Z.string(),
					ownership: Z.object({
						txtRecord: Z.string().optional(),
						verified: Z.boolean(),
					}),
				}),
			});

			return {
				ingressId,
				verified: ingress.ownership.verified,
				hostname: ingress.hostname,
				expectedTxtRecord: ingress.ownership.txtRecord ?? '',
			};
		}
	});
