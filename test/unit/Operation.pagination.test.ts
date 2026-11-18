import { describe, expect, it, vi } from 'vitest';
import type { IAllExecuteFunctions } from 'n8n-workflow';
import { Operation, Resource } from '../../nodes/Mittwald/resources/base';
import type { OperationExecutionFunction } from '../../nodes/Mittwald/resources/base/Operation';

const resource = new Resource({ name: 'Unit Test Resource' });

/**
 * An execution context whose node parameters come from `values`. Like n8n, it
 * throws for a parameter it cannot resolve (e.g. one hidden by displayOptions).
 */
function fakeNode(values: Record<string, unknown>) {
	return {
		getNodeParameter: (name: string) => {
			if (!(name in values)) {
				throw new Error(`Could not get parameter "${name}"`);
			}
			return values[name];
		},
		getNode: () => ({ name: 'mittwald' }),
		logger: { info: vi.fn() },
		helpers: { httpRequestWithAuthentication: vi.fn() },
	} as unknown as IAllExecuteFunctions;
}

function createOperation(paginated: boolean, executionFn: OperationExecutionFunction = vi.fn()) {
	return new Operation(
		resource,
		{ name: 'List', action: 'List things', description: 'Get a list of things', paginated },
		executionFn,
		{
			project: { displayName: 'Project', type: 'string', default: '' },
		},
	);
}

describe('Operation with paginated: true', () => {
	it('adds the Return All and Limit fields after its own properties', () => {
		const properties = createOperation(true).getN8NProperties();

		expect(properties.map((property) => property.name)).toEqual(['project', 'returnAll', 'limit']);
		expect(properties[1]).toMatchObject({
			displayName: 'Return All',
			type: 'boolean',
			default: true,
			displayOptions: { show: { resource: ['Unit Test Resource'], operation: ['List'] } },
		});
		expect(properties[2]).toMatchObject({
			displayName: 'Limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1 },
			displayOptions: {
				show: { resource: ['Unit Test Resource'], operation: ['List'], returnAll: [false] },
			},
		});
	});

	it('passes the chosen limit to the execute function', async () => {
		const executionFn = vi.fn().mockResolvedValue([]);
		const operation = createOperation(true, executionFn);

		await operation.execute(fakeNode({ project: 'p-1', returnAll: false, limit: 5 }), 0);

		expect(executionFn).toHaveBeenCalledWith(
			expect.objectContaining({ pagination: { returnAll: false, limit: 5 } }),
		);
	});

	it('falls back to the default limit while Limit is hidden by Return All', async () => {
		const executionFn = vi.fn().mockResolvedValue([]);
		const operation = createOperation(true, executionFn);

		await operation.execute(fakeNode({ project: 'p-1', returnAll: true }), 0);

		expect(executionFn).toHaveBeenCalledWith(
			expect.objectContaining({ pagination: { returnAll: true, limit: 50 } }),
		);
	});

	it('refuses an operation that defines its own returnAll or limit', () => {
		expect(
			() =>
				new Operation(
					resource,
					{ name: 'Broken', action: 'Break things', description: 'Broken', paginated: true },
					vi.fn(),
					{ limit: { displayName: 'Limit', type: 'number', default: 10 } },
				),
		).toThrow('must not define its own "limit" property');
	});
});

describe('Operation without paginated', () => {
	it('adds no pagination fields', () => {
		const properties = createOperation(false).getN8NProperties();

		expect(properties.map((property) => property.name)).toEqual(['project']);
	});

	it('passes no pagination to the execute function', async () => {
		const executionFn = vi.fn().mockResolvedValue({});
		const operation = createOperation(false, executionFn);

		await operation.execute(fakeNode({ project: 'p-1' }), 0);

		expect(executionFn.mock.calls[0][0]).not.toHaveProperty('pagination');
	});
});
