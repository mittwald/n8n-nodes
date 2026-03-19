/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { readFileSync } from 'node:fs';
import { env, setEnv } from './runtime';

let loaded = false;

export function loadDotEnv(path = '.env'): void {
	if (loaded) {
		return;
	}
	loaded = true;

	let fileContents = '';
	try {
		fileContents = readFileSync(path, 'utf8');
	} catch (error) {
		const errorRecord = error as { code?: string };
		if (errorRecord?.code === 'ENOENT') {
			return;
		}
		throw error;
	}

	for (const rawLine of fileContents.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) {
			continue;
		}

		const separatorIndex = line.indexOf('=');
		if (separatorIndex <= 0) {
			continue;
		}

		const key = line.slice(0, separatorIndex).trim();
		let value = line.slice(separatorIndex + 1).trim();

		const hasDoubleQuotes = value.startsWith('"') && value.endsWith('"');
		const hasSingleQuotes = value.startsWith("'") && value.endsWith("'");
		if (hasDoubleQuotes || hasSingleQuotes) {
			value = value.slice(1, -1);
		}

		if (!key || env(key) !== undefined) {
			continue;
		}

		setEnv(key, value);
	}
}
