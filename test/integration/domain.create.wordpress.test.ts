/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import { hasIntegrationEnv, runId } from './helpers';
import { testcase } from './testcase';

const integrationDescribe = hasIntegrationEnv() ? describe : describe.skip;

integrationDescribe('Domain / Create (WordPress subdomain)', () => {
	testcase(
		'creates a project.space subdomain for a WordPress installation',
		async (context) => {
			const projectDescription = `it-${runId('domain-project')}`;
			const installDescription = `it-${runId('domain-install')}`;
			const installationPath = `/html/${runId('wp').slice(0, 8)}`;
			const subdomain = `${runId('wp')}.project.space`;

			const createdProject = await context.runOperation({
				resource: 'Project',
				operation: 'Create',
				parameters: {
					server: {
						mode: 'id',
						value: context.env.testServerId,
					},
					description: projectDescription,
				},
			});

			const projectId = readRequiredString(createdProject.firstItem.json, 'id');
			context.teardown(async () => {
				await context.mittwaldApi.deleteProject(projectId);
			});

			const app = await findWordPressApp(context);
			const version = await findLatestAppVersion(context, app.id);
			const versionConfig = await buildVersionConfig({
				context,
				appId: app.id,
				versionId: version.id,
				hostDomain: subdomain,
				siteTitle: `WP ${runId('site')}`,
			});

			await context.runOperation({
				resource: 'App',
				operation: 'Install',
				parameters: {
					project: {
						mode: 'id',
						value: projectId,
					},
					app: {
						mode: 'id',
						value: app.id,
					},
					version: {
						mode: 'id',
						value: version.id,
					},
					description: installDescription,
					installationPath,
					versionConfig,
					waitUntilInstalled: true,
				},
			});

			const installation = await context.mittwaldApi.waitForAppInstallationByDescription({
				description: installDescription,
				timeoutMs: 180000,
			});

			const domainResult = await context.runOperation({
				resource: 'Domain',
				operation: 'Create',
				parameters: {
					fullName: subdomain,
					targetInstallation: {
						mode: 'id',
						value: installation.id,
					},
				},
			});

			expect(readOptionalString(domainResult.firstItem.json, 'id')).toBeTruthy();
		},
		180_000,
	);
});

async function findWordPressApp(context: {
	mittwaldApi: { listApps: () => Promise<Array<{ id: string; name: string }>> };
}) {
	const apps = await context.mittwaldApi.listApps();
	const app = apps.find((entry) => entry.name.toLowerCase().includes('wordpress'));
	if (!app) {
		throw new Error('Could not find WordPress app in /apps response');
	}
	return app;
}

async function findLatestAppVersion(
	context: {
		mittwaldApi: {
			listAppVersions: (appId: string) => Promise<Array<{ id: string; externalVersion: string }>>;
		};
	},
	appId: string,
) {
	const versions = await context.mittwaldApi.listAppVersions(appId);
	if (versions.length === 0) {
		throw new Error('No app versions returned for WordPress');
	}

	const sorted = [...versions].sort((a, b) =>
		compareVersions(a.externalVersion, b.externalVersion),
	);
	return sorted[sorted.length - 1];
}

async function buildVersionConfig({
	context,
	appId,
	versionId,
	hostDomain,
	siteTitle,
}: {
	context: {
		mittwaldApi: {
			getAppVersionDetails: (
				appId: string,
				versionId: string,
			) => Promise<{ userInputs?: Array<{ name: string; dataType?: string }> }>;
		};
	};
	appId: string;
	versionId: string;
	hostDomain: string;
	siteTitle: string;
}) {
	const versionDetails = await context.mittwaldApi.getAppVersionDetails(appId, versionId);
	const userInputs = versionDetails.userInputs ?? [];

	const value: Record<string, string | number | boolean> = {};
	for (const input of userInputs) {
		const name = input.name;
		const lower = name.toLowerCase();
		if (lower.includes('host')) {
			value[name] = `https://${hostDomain}`;
			continue;
		}
		if (lower.includes('site_title')) {
			value[name] = siteTitle;
			continue;
		}
		if (lower.includes('admin_user')) {
			value[name] = 'admin';
			continue;
		}
		if (lower.includes('admin_pass') || lower.includes('password')) {
			value[name] = `S3cure!${runId('pw')}`;
			continue;
		}
		if (lower.includes('admin_email') || lower.includes('email')) {
			value[name] = `admin+${runId('mail')}@example.com`;
			continue;
		}
		if (input.dataType === 'number') {
			value[name] = 1;
			continue;
		}
		if (input.dataType === 'boolean') {
			value[name] = true;
			continue;
		}
		value[name] = `it-${name}`;
	}

	const schema = userInputs.map((input) => ({
		displayName: input.name,
		display: true,
		required: true,
		id: input.name,
		defaultMatch: false,
		type: input.dataType === 'number' || input.dataType === 'boolean' ? input.dataType : 'string',
	}));

	return {
		mappingMode: 'defineBelow',
		value,
		matchingColumns: [],
		schema,
		attemptToConvertTypes: false,
		convertFieldsToString: false,
	};
}

function compareVersions(a: string, b: string): number {
	const parse = (input: string) =>
		input
			.split('.')
			.map((segment) => Number.parseInt(segment.replace(/[^\d]/g, ''), 10))
			.map((segment) => (Number.isNaN(segment) ? 0 : segment));

	const aParts = parse(a);
	const bParts = parse(b);
	const length = Math.max(aParts.length, bParts.length);
	for (let i = 0; i < length; i += 1) {
		const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
		if (diff !== 0) {
			return diff;
		}
	}
	return 0;
}

function readRequiredString(source: Record<string, unknown>, key: string): string {
	const value = source[key];
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}

	throw new Error(`Expected property "${key}" to be a non-empty string`);
}

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
	const value = source[key];
	return typeof value === 'string' ? value : undefined;
}
