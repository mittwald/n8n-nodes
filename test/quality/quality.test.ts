/* eslint-disable @n8n/community-nodes/no-restricted-imports */
/* eslint-disable @n8n/community-nodes/no-restricted-globals */
import { describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { buildNodeModel } from './nodeModel';
import { buildCoverage, untestedWrites } from './coverage';
import { lintNode } from './rules';
import { renderReport } from './report';

const BASELINE_PATH = new URL('./baseline.json', import.meta.url).pathname;
const REPORT_PATH = new URL('../../docs/quality/operations-report.md', import.meta.url).pathname;

interface Baseline {
	lint: string[];
	untestedWriteOperations: string[];
}

const emptyBaseline: Baseline = { lint: [], untestedWriteOperations: [] };

const readBaseline = (): Baseline => {
	try {
		const parsed: unknown = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
		if (typeof parsed !== 'object' || parsed === null) {
			return emptyBaseline;
		}

		const lint = 'lint' in parsed ? parsed.lint : [];
		const untested = 'untestedWriteOperations' in parsed ? parsed.untestedWriteOperations : [];

		return {
			lint: Array.isArray(lint) ? lint.filter((entry) => typeof entry === 'string') : [],
			untestedWriteOperations: Array.isArray(untested)
				? untested.filter((entry) => typeof entry === 'string')
				: [],
		};
	} catch {
		return emptyBaseline;
	}
};

const resources = buildNodeModel();
const coverage = buildCoverage(resources);
const findings = lintNode(resources);
const baseline = readBaseline();
const shouldUpdateBaseline = process.env.QUALITY_BASELINE === 'update';

const currentUntestedWrites = untestedWrites(coverage)
	.map((entry) => `${entry.operation.resource}:${entry.operation.name}`)
	.sort();

/** In update mode the baseline is rewritten, so it always matches the current state. */
const acceptedFindings = new Set(
	shouldUpdateBaseline ? findings.map((item) => item.id) : baseline.lint,
);
const acceptedUntestedWrites = new Set(
	shouldUpdateBaseline ? currentUntestedWrites : baseline.untestedWriteOperations,
);

if (shouldUpdateBaseline) {
	writeFileSync(
		BASELINE_PATH,
		`${JSON.stringify(
			{
				lint: findings.map((item) => item.id).sort(),
				untestedWriteOperations: currentUntestedWrites,
			},
			null,
			'\t',
		)}\n`,
		'utf8',
	);
}

mkdirSync(REPORT_PATH.replace(/\/[^/]+$/, ''), { recursive: true });
writeFileSync(
	REPORT_PATH,
	renderReport({ resources, coverage, findings, baseline: acceptedFindings }),
	'utf8',
);

describe('Operation quality', () => {
	it('introduces no new UX consistency findings', () => {
		const fresh = findings.filter((item) => acceptedFindings.has(item.id) === false);

		expect(fresh.map((item) => `[${item.severity}] ${item.rule} — ${item.message}`)).toEqual([]);
	});

	it('has no stale baseline entries', () => {
		const currentIds = new Set(findings.map((item) => item.id));
		const stale = Array.from(acceptedFindings).filter((id) => currentIds.has(id) === false);

		expect(
			stale,
			'These findings are fixed — run `QUALITY_BASELINE=update pnpm run test:quality` to shrink the baseline',
		).toEqual([]);
	});

	it('leaves no new side-effecting operation untested', () => {
		expect(currentUntestedWrites.filter((id) => acceptedUntestedWrites.has(id) === false)).toEqual(
			[],
		);
	});

	it('has no stale untested-write baseline entries', () => {
		const current = new Set(currentUntestedWrites);
		const stale = Array.from(acceptedUntestedWrites).filter((id) => current.has(id) === false);

		expect(
			stale,
			'These operations gained coverage — run `QUALITY_BASELINE=update pnpm run test:quality` to shrink the baseline',
		).toEqual([]);
	});

	it('has no test referencing an unknown operation', () => {
		expect(
			coverage.orphanedReferences.map(
				(orphan) => `${orphan.reference} (${orphan.tests.join(', ')})`,
			),
		).toEqual([]);
	});
});
