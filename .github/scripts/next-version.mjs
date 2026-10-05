// Determines what the Publish workflow releases and writes it to $GITHUB_OUTPUT:
//
// - `version`: the version to release; empty if there is nothing to do.
// - `sha`:     the commit to release from. The publish job checks out exactly this commit, so the
//              atomic push to master fails if anything was merged after the version was chosen.
// - `resume`:  `true` if `version` is an already tagged release whose npm package or GitHub
//              release is still missing (e.g. after a failed run). The publish job then skips the
//              version commit and tag and only completes the missing steps.
//
// Usage: node .github/scripts/next-version.mjs [version]
//
// - An unfinished release is always completed first.
// - With an explicit version (manual workflow run), it is validated: valid semver, no existing
//   tag, and greater than the last release.
// - Without one (nightly run), it is derived from the Conventional Commits since the last release
//   tag: a breaking change bumps major, `feat` bumps minor, `fix`/`perf` bump patch. If none of
//   them occur, the output is empty and no release happens.

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

// Strict MAJOR.MINOR.PATCH: no prerelease or build suffix, no leading zeroes.
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function run(command, ...args) {
	return execFileSync(command, args, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	}).trim();
}

function succeeds(command, ...args) {
	try {
		run(command, ...args);
		return true;
	} catch {
		return false;
	}
}

function parse(version) {
	const match = SEMVER.exec(version);
	return match ? match.slice(1).map(Number) : undefined;
}

function parseOrFail(version) {
	const parsed = parse(version);
	if (!parsed) {
		throw new Error(`"${version}" is not a valid version (expected MAJOR.MINOR.PATCH).`);
	}
	return parsed;
}

function compare(a, b) {
	for (let i = 0; i < 3; i++) {
		if (a[i] !== b[i]) return a[i] - b[i];
	}
	return 0;
}

// The highest strict-semver `vX.Y.Z` tag reachable from HEAD; prerelease tags are ignored.
function lastReleaseTag() {
	return run('git', 'tag', '--merged', 'HEAD', '--list', 'v*')
		.split('\n')
		.map((tag) => ({ tag, version: parse(tag.slice(1)) }))
		.filter(({ version }) => version)
		.sort((a, b) => compare(b.version, a.version))[0];
}

// Only releases made by this workflow carry their version in package.json. Older tags (from
// semantic-release or created by hand) are treated as finished, whatever is on npm.
function isUnfinished(tag, packageName) {
	const version = tag.slice(1);
	const manifest = JSON.parse(run('git', 'show', `${tag}:package.json`));
	if (manifest.version !== version) {
		return false;
	}
	const onNpm = succeeds('npm', 'view', `${packageName}@${version}`, 'version');
	const hasRelease = succeeds('gh', 'release', 'view', tag);
	return !onNpm || !hasRelease;
}

function bumpFromCommits(sinceTag) {
	const range = sinceTag ? `${sinceTag}..HEAD` : 'HEAD';
	const log = run('git', 'log', range, '--format=%s%x1f%b%x1e');
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

function output(values) {
	console.log(values.version ? `Release: ${JSON.stringify(values)}` : 'Nothing to release.');
	if (process.env.GITHUB_OUTPUT) {
		const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
		appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
	}
}

const packageName = JSON.parse(readFileSync('package.json', 'utf8')).name;
const requested = (process.argv[2] ?? '').trim().replace(/^v/, '');
const last = lastReleaseTag();
console.log(`Last release: ${last?.tag ?? '(none)'}`);

if (last && isUnfinished(last.tag, packageName)) {
	const version = last.tag.slice(1);
	if (requested && requested !== version) {
		throw new Error(
			`Release ${last.tag} is unfinished (npm package or GitHub release missing). ` +
				`Run the workflow without a version, or with ${version}, to complete it first.`,
		);
	}
	console.log(`${last.tag} is unfinished; completing it.`);
	output({ version, sha: run('git', 'rev-list', '-n', '1', last.tag), resume: 'true' });
	process.exit(0);
}

const sha = run('git', 'rev-parse', 'HEAD');
let version;
if (requested) {
	const next = parseOrFail(requested);
	if (run('git', 'tag', '--list', `v${requested}`)) {
		throw new Error(`Tag v${requested} already exists.`);
	}
	if (last && compare(next, last.version) <= 0) {
		throw new Error(`Version ${requested} must be greater than the last release ${last.tag}.`);
	}
	version = requested;
} else {
	const bump = bumpFromCommits(last?.tag);
	if (!bump) {
		console.log('No feat, fix, perf or breaking commits since the last release.');
		output({ version: '', sha, resume: 'false' });
		process.exit(0);
	}
	version = apply(bump, last?.version ?? [0, 0, 0]);
	console.log(`Derived a ${bump} bump from the commits.`);
}

output({ version, sha, resume: 'false' });
