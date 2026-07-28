/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, testcase } from './testcase';

/** Aggregate domain of the contract that carries an AI hosting plan. */
const AI_HOSTING_AGGREGATE = 'mittwald.llmlocksmith.v1';

integrationDescribe('Contract / Termination (integration)', () => {
	testcase(
		'terminates a contract and withdraws the termination again',
		async (context) => {
			const customerId = context.env.customerId;
			if (!customerId) {
				// Needs a customer whose contracts may be terminated; skip when unconfigured.
				return;
			}

			const contracts = await context.mittwaldApi.contract.listContracts({ customerId });
			if (contracts.status !== 200) {
				throw new Error(`Failed to list contracts: ${contracts.statusText}`);
			}

			// Deliberately not the server contract: terminating that would take the test
			// server with it, and every other suite depends on it.
			const aiHostingContract = contracts.data.find(
				(entry) => entry.baseItem?.aggregateReference?.domain === AI_HOSTING_AGGREGATE,
			);
			if (!aiHostingContract) {
				return;
			}
			const contractId = aiHostingContract.contractId;

			// The termination is withdrawn again so the plan survives the test run.
			context.teardown(async () => {
				const cancelled = await context.mittwaldApi.contract.cancelContractTermination({
					contractId,
				});
				if (cancelled.status !== 204 && cancelled.status !== 200) {
					throw new Error(
						`Failed to withdraw the contract termination (status ${cancelled.status}) — contract ${contractId} is still terminating`,
					);
				}
			});

			const terminated = await context.runOperation({
				resource: 'Contract',
				operation: 'Terminate',
				parameters: {
					contractId,
					targetDate: '',
					reason: 'integration test',
				},
			});
			expect(terminated.items.length).toBeGreaterThan(0);

			const afterTermination = await context.mittwaldApi.contract.getDetailOfContract({
				contractId,
			});
			if (afterTermination.status !== 200) {
				throw new Error(`Failed to read contract: ${afterTermination.statusText}`);
			}
			expect(afterTermination.data.baseItem?.termination).toBeTruthy();
		},
		180_000,
	);

	testcase(
		'terminates a single contract item and withdraws it again',
		async (context) => {
			const customerId = context.env.customerId;
			if (!customerId) {
				return;
			}

			const contracts = await context.mittwaldApi.contract.listContracts({ customerId });
			if (contracts.status !== 200) {
				throw new Error(`Failed to list contracts: ${contracts.statusText}`);
			}

			// Positions that are backed by their own resource — domains in particular —
			// answer 412 "managed by domain"; they are removed by deleting that resource.
			// The test therefore needs an ordinary additional position and skips when the
			// account has none.
			let contractId: string | undefined;
			let contractItemId: string | undefined;
			for (const contract of contracts.data) {
				const item = (contract.additionalItems ?? []).find(
					(entry) => entry.aggregateReference?.domain !== 'mittwald.domain.v1',
				);
				if (item) {
					contractId = contract.contractId;
					contractItemId = item.itemId;
					break;
				}
			}
			if (!contractId || !contractItemId) {
				return;
			}

			context.teardown(async () => {
				const cancelled = await context.mittwaldApi.contract.cancelContractItemTermination({
					contractId,
					contractItemId,
				});
				if (cancelled.status !== 204 && cancelled.status !== 200) {
					throw new Error(
						`Failed to withdraw the item termination (status ${cancelled.status}) — item ${contractItemId} is still terminating`,
					);
				}
			});

			const terminated = await context.runOperation({
				resource: 'Contract',
				operation: 'Terminate Item',
				parameters: {
					contractId,
					contractItemId,
					targetDate: '',
					reason: 'integration test',
				},
			});
			expect(terminated.items.length).toBeGreaterThan(0);
		},
		180_000,
	);
});
