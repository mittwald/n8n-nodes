// Determines the version for the next release and writes it to $GITHUB_OUTPUT as `version`.
//
// Usage: node .github/scripts/next-version.mjs [version]
//
// - With an explicit version (manual workflow run), it is validated: valid semver, no existing
//   tag, and greater than the last release.
// - Without one (nightly run), it is derived from the Conventional Commits since the last release
//   tag: a breaking change bumps major, `feat` bumps minor, `fix`/`perf` bump patch. If none of
//   them occur, the output is empty and no release happens.

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function git(...args) {
	return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function parse(version) {
	const match = SEMVER.exec(version);
	if (!match) {
		throw new Error(`"${version}" is not a valid version (expected MAJOR.MINOR.PATCH).`);
	}
	return match.slice(1).map(Number);
}

function isGreater(a, b) {
	for (let i = 0; i < 3; i++) {
		if (a[i] !== b[i]) return a[i] > b[i];
	}
	return false;
}

function lastReleaseTag() {
	try {
		return git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*.[0-9]*.[0-9]*');
	} catch {
		return undefined;
	}
}

function bumpFromCommits(sinceTag) {
	const range = sinceTag ? `${sinceTag}..HEAD` : 'HEAD';
	const log = git('log', range, '--format=%s%x1f%b%x1e');
	const commits = log
		.split('\x1e')
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => {
			const [subject, body = ''] = entry.split('\x1f');
			return { subject, body };
		});

	let bump;
	for (const { subject, body } of commits) {
		const header = /^(\w+)(?:\([^)]*\))?(!)?:/.exec(subject);
		if ((header && header[2]) || /^BREAKING[ -]CHANGE:/m.test(body)) {
			return 'major';
		}
		const type = header?.[1];
		if (type === 'feat') {
			bump = 'minor';
		} else if ((type === 'fix' || type === 'perf') && !bump) {
			bump = 'patch';
		}
	}
	return bump;
}

function apply(bump, [major, minor, patch]) {
	if (bump === 'major') return `${major + 1}.0.0`;
	if (bump === 'minor') return `${major}.${minor + 1}.0`;
	return `${major}.${minor}.${patch + 1}`;
}

function output(version) {
	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
	}
}

const requested = (process.argv[2] ?? '').trim().replace(/^v/, '');
const tag = lastReleaseTag();
const last = tag ? parse(tag.slice(1)) : [0, 0, 0];
console.log(`Last release: ${tag ?? '(none)'}`);

let version;
if (requested) {
	const next = parse(requested);
	if (git('tag', '--list', `v${requested}`)) {
		throw new Error(`Tag v${requested} already exists.`);
	}
	if (!isGreater(next, last)) {
		throw new Error(`Version ${requested} must be greater than the last release ${tag}.`);
	}
	version = requested;
} else {
	const bump = bumpFromCommits(tag);
	if (!bump) {
		console.log('No feat, fix, perf or breaking commits since the last release; nothing to do.');
		output('');
		process.exit(0);
	}
	version = apply(bump, last);
	console.log(`Derived a ${bump} bump from the commits.`);
}

console.log(`Next version: ${version}`);
output(version);
