import type { OperationModel, ResourceModel } from './nodeModel';
import { flattenOperations, operationId } from './nodeModel';

export type Severity = 'error' | 'warning';

export interface Finding {
	/** Stable identifier used to match against the baseline. */
	id: string;
	rule: string;
	severity: Severity;
	scope: string;
	message: string;
}

/**
 * Words that may stay lowercase inside a Title Case string, as long as they are
 * neither the first nor the last word.
 */
const MINOR_WORDS = new Set([
	'a',
	'an',
	'and',
	'as',
	'at',
	'but',
	'by',
	'for',
	'from',
	'in',
	'into',
	'nor',
	'of',
	'on',
	'or',
	'per',
	'the',
	'to',
	'via',
	'with',
]);

/** Acronyms that must be fully capitalised in user-facing labels. */
const ACRONYMS = [
	'API',
	'CPU',
	'DNS',
	'FTP',
	'HTTP',
	'HTTPS',
	'ID',
	'IP',
	'JSON',
	'PHP',
	'SFTP',
	'SSH',
	'SSL',
	'TLS',
	'TTL',
	'URI',
	'URL',
	'UUID',
];

/** Leading verbs we consider proper, natural-language action wording. */
const ACTION_VERBS = new Set([
	'accept',
	'add',
	'cancel',
	'check',
	'copy',
	'create',
	'delete',
	'deploy',
	'disable',
	'download',
	'enable',
	'get',
	'install',
	'invite',
	'link',
	'list',
	'move',
	'remove',
	'rename',
	'reset',
	'restart',
	'restore',
	'run',
	'schedule',
	'send',
	'set',
	'start',
	'stop',
	'trigger',
	'uninstall',
	'unlink',
	'update',
	'upload',
	'verify',
]);

const stripDecoration = (word: string): string => word.replace(/^[^\p{L}\p{N}]+/u, '');

const isTitleCased = (value: string): boolean => {
	const words = value.split(/\s+/).filter((word) => word.length > 0);

	return words.every((rawWord, index) => {
		const word = stripDecoration(rawWord);
		if (word.length === 0) {
			return true;
		}

		const isMinor = index > 0 && index < words.length - 1 && MINOR_WORDS.has(word.toLowerCase());
		if (isMinor) {
			return true;
		}

		const first = word[0];
		return first === first.toUpperCase();
	});
};

const findMiscasedAcronyms = (value: string): string[] =>
	ACRONYMS.filter((acronym) => {
		const pattern = new RegExp(`(^|[^\\p{L}])${acronym}(?![\\p{L}])`, 'iu');
		const match = value.match(pattern);
		if (!match) {
			return false;
		}
		return match[0].endsWith(acronym) === false;
	});

/** Product names whose internal capitalisation is intentional, not an identifier leak. */
const BRAND_NAMES = [
	'MariaDB',
	'MySQL',
	'PostgreSQL',
	'TYPO3',
	'WebUI',
	'WooCommerce',
	'WordPress',
	'phpMyAdmin',
];

const containsIdentifierSyntax = (value: string): boolean => {
	const withoutBrands = BRAND_NAMES.reduce(
		(text, brand) => text.replace(new RegExp(brand, 'g'), ''),
		value,
	);

	return /[a-z][A-Z]/.test(withoutBrands) || /_/.test(withoutBrands);
};

const finding = (
	rule: string,
	severity: Severity,
	scope: string,
	message: string,
): Finding => ({
	id: `${rule}|${scope}`,
	rule,
	severity,
	scope,
	message,
});

const lintOperation = (operation: OperationModel): Finding[] => {
	const findings: Finding[] = [];
	const scope = operationId(operation);
	const action = operation.action ?? '';
	const description = operation.description ?? '';

	if (isTitleCased(operation.name) === false) {
		findings.push(
			finding(
				'operation-name-title-case',
				'error',
				scope,
				`Operation name "${operation.name}" is not Title Case`,
			),
		);
	}

	if (action.length === 0) {
		findings.push(finding('operation-action-missing', 'error', scope, 'Operation has no action'));
	} else {
		if (action[0] !== action[0].toUpperCase()) {
			findings.push(
				finding(
					'operation-action-capitalized',
					'error',
					scope,
					`Action "${action}" does not start with a capital letter`,
				),
			);
		}

		if (containsIdentifierSyntax(action)) {
			findings.push(
				finding(
					'operation-action-identifier-syntax',
					'error',
					scope,
					`Action "${action}" reads like an internal identifier; use plain language`,
				),
			);
		}

		const verb = action.split(/\s+/)[0].toLowerCase();
		if (ACTION_VERBS.has(verb) === false) {
			findings.push(
				finding(
					'operation-action-verb',
					'warning',
					scope,
					`Action "${action}" does not start with a recognised verb ("${verb}") — verify the wording`,
				),
			);
		}
	}

	if (description.length === 0) {
		findings.push(
			finding(
				'operation-description-missing',
				'error',
				scope,
				'Operation has no description (required per AGENTS.md)',
			),
		);
	} else if (description.length < 15) {
		findings.push(
			finding(
				'operation-description-too-short',
				'warning',
				scope,
				`Description "${description}" is too terse to help in the n8n UI`,
			),
		);
	}

	for (const property of operation.properties) {
		const propertyScope = `${scope}.${property.name}`;

		if (isTitleCased(property.displayName) === false) {
			findings.push(
				finding(
					'property-display-name-title-case',
					'error',
					propertyScope,
					`Display name "${property.displayName}" is not Title Case`,
				),
			);
		}

		const miscased = findMiscasedAcronyms(property.displayName);
		if (miscased.length > 0) {
			findings.push(
				finding(
					'property-display-name-acronym',
					'error',
					propertyScope,
					`Display name "${property.displayName}" should capitalise ${miscased.join(', ')}`,
				),
			);
		}

		if (property.hasDefault === false) {
			findings.push(
				finding(
					'property-default-missing',
					'error',
					propertyScope,
					`Property "${property.displayName}" has no default value`,
				),
			);
		}

		if (
			(property.description ?? '').length === 0 &&
			property.type !== 'resourceLocator' &&
			property.type !== 'resourceMapper'
		) {
			findings.push(
				finding(
					'property-description-missing',
					'warning',
					propertyScope,
					`Property "${property.displayName}" has no description (shown as a hint in n8n)`,
				),
			);
		}
	}

	return findings;
};

const lintConsistency = (operations: OperationModel[]): Finding[] => {
	const findings: Finding[] = [];

	const displayNamesByProperty = new Map<string, Map<string, string[]>>();
	const typesByProperty = new Map<string, Map<string, string[]>>();
	const operationsByAction = new Map<string, string[]>();

	for (const operation of operations) {
		const scope = operationId(operation);

		if (operation.action !== undefined) {
			const users = operationsByAction.get(operation.action) ?? [];
			users.push(scope);
			operationsByAction.set(operation.action, users);
		}

		for (const property of operation.properties) {
			const displayNames = displayNamesByProperty.get(property.name) ?? new Map<string, string[]>();
			displayNames.set(property.displayName, [
				...(displayNames.get(property.displayName) ?? []),
				scope,
			]);
			displayNamesByProperty.set(property.name, displayNames);

			const types = typesByProperty.get(property.name) ?? new Map<string, string[]>();
			types.set(property.type, [...(types.get(property.type) ?? []), scope]);
			typesByProperty.set(property.name, types);
		}
	}

	for (const [propertyName, displayNames] of displayNamesByProperty) {
		if (displayNames.size <= 1) {
			continue;
		}

		const variants = Array.from(displayNames.entries())
			.map(([displayName, scopes]) => `"${displayName}" (${scopes.join(', ')})`)
			.join(' vs. ');

		findings.push(
			finding(
				'property-display-name-inconsistent',
				'warning',
				propertyName,
				`Property "${propertyName}" is labelled differently across operations: ${variants}`,
			),
		);
	}

	for (const [propertyName, types] of typesByProperty) {
		if (types.size <= 1) {
			continue;
		}

		const variants = Array.from(types.entries())
			.map(([type, scopes]) => `${type} (${scopes.join(', ')})`)
			.join(' vs. ');

		findings.push(
			finding(
				'property-type-inconsistent',
				'warning',
				propertyName,
				`Property "${propertyName}" uses different types across operations: ${variants}`,
			),
		);
	}

	for (const [action, scopes] of operationsByAction) {
		if (scopes.length <= 1) {
			continue;
		}

		findings.push(
			finding(
				'operation-action-duplicate',
				'warning',
				action,
				`Action "${action}" is used by ${scopes.join(', ')} — indistinguishable in n8n's action list`,
			),
		);
	}

	return findings;
};

export const lintNode = (resources: ResourceModel[]): Finding[] => {
	const operations = flattenOperations(resources);

	return [...operations.flatMap(lintOperation), ...lintConsistency(operations)].sort((a, b) =>
		a.id.localeCompare(b.id),
	);
};
