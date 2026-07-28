import type { OperationModel, ResourceModel } from './nodeModel';
import { flattenOperations, operationId } from './nodeModel';

/**
 * Operation name prefixes that describe pure reads. Everything else is treated
 * as side-effecting and therefore requires an integration test (AGENTS.md).
 */
const READ_ONLY_PREFIXES = ['Get', 'List', 'Check', 'Is', 'Resolve'];

export const isReadOnly = (operation: OperationModel): boolean =>
	READ_ONLY_PREFIXES.some(
		(prefix) => operation.name === prefix || operation.name.startsWith(`${prefix} `),
	);

/**
 * Test sources are pulled in at build time so this works without filesystem
 * access and stays in sync with whatever vitest would actually run.
 */
const testSources: Record<string, string> = import.meta.glob('../integration/**/*.test.ts', {
	query: '?raw',
	import: 'default',
	eager: true,
});

const STEP_PATTERN = /resource:\s*'([^']+)'\s*,\s*operation:\s*'([^']+)'/g;

export interface CoverageEntry {
	operation: OperationModel;
	tests: string[];
}

export interface CoverageReport {
	entries: CoverageEntry[];
	/** (resource, operation) pairs referenced by tests that no longer exist. */
	orphanedReferences: Array<{ reference: string; tests: string[] }>;
}

const shortName = (path: string): string => path.replace(/^.*\//, '');

export const buildCoverage = (resources: ResourceModel[]): CoverageReport => {
	const referencedBy = new Map<string, Set<string>>();

	for (const [path, source] of Object.entries(testSources)) {
		for (const match of source.matchAll(STEP_PATTERN)) {
			const reference = `${match[1]}:${match[2]}`;
			const tests = referencedBy.get(reference) ?? new Set<string>();
			tests.add(shortName(path));
			referencedBy.set(reference, tests);
		}
	}

	const operations = flattenOperations(resources);
	const knownIds = new Set(operations.map(operationId));

	const entries = operations.map((operation) => ({
		operation,
		tests: Array.from(referencedBy.get(operationId(operation)) ?? []).sort(),
	}));

	const orphanedReferences = Array.from(referencedBy.entries())
		.filter(([reference]) => knownIds.has(reference) === false)
		.map(([reference, tests]) => ({ reference, tests: Array.from(tests).sort() }))
		.sort((a, b) => a.reference.localeCompare(b.reference));

	return { entries, orphanedReferences };
};

export const untestedWrites = (coverage: CoverageReport): CoverageEntry[] =>
	coverage.entries.filter(
		(entry) => entry.tests.length === 0 && isReadOnly(entry.operation) === false,
	);
