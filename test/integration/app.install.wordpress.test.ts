/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import {
	createManualTriggerNode,
	createMittwaldNode,
	createSequentialWorkflow,
	hasIntegrationEnv,
	runId,
} from './helpers';
import { readRequiredString, testcase } from './testcase';

const integrationDescribe = hasIntegrationEnv() ? describe : describe.skip;

integrationDescribe('App / Install WordPress (integration)', () => {
	testcase(
		'installs the latest WordPress version on a new project',
		async (context) => {
			const projectDescription = `it-${runId('wp-project')}`;
			const installDescription = `it-${runId('wp-install')}`;
			const installationPath = `/html/${runId('wp').slice(0, 8)}`;

			const app = await findWordPressApp(context);
			const version = await findLatestAppVersion(context, app.id);
			const versionConfig = await buildVersionConfig({
				context,
				appId: app.id,
				versionId: version.id,
				hostDomain: `${runId('wp')}.project.space`,
				siteTitle: `WP ${runId('site')}`,
			});

			const trigger = createManualTriggerNode();
			const createProjectNode = createMittwaldNode(context.env, {
				name: 'Create Project',
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
			const installNode = createMittwaldNode(context.env, {
				name: 'Install WordPress',
				resource: 'App',
				operation: 'Install',
				parameters: {
					project: {
						mode: 'id',
						value: '={{ $node["Create Project"].json["id"] }}',
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

			const result = await context.runWorkflow({
				workflow: createSequentialWorkflow([trigger, createProjectNode, installNode]),
			});

			const createdItems = result.getNodeItems(createProjectNode.name, { allowEmpty: false });
			const projectId = readRequiredString(createdItems[0]?.json ?? {}, 'id');
			context.teardown(async () => {
				await context.mittwaldApi.deleteProject(projectId);
			});

			const installedItems = result.getNodeItems(installNode.name, { allowEmpty: false });
			expect(readOptionalString(installedItems[0]?.json ?? {}, 'phase')).toBeDefined();

			const installation = await context.mittwaldApi.waitForAppInstallationByDescription({
				description: installDescription,
			});
			expect(installation.id).toBeTruthy();
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

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
	const value = source[key];
	return typeof value === 'string' ? value : undefined;
}
