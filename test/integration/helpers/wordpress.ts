import type {
	MittwaldApiClient,
	MittwaldApp,
	MittwaldAppVersion,
	MittwaldAppVersionDetails,
} from './mittwaldApiClient';
import { runId } from './runMittwaldOperation';

export type WordPressInstallInput = {
	app: MittwaldApp;
	version: MittwaldAppVersion;
	versionConfig: {
		mappingMode: 'defineBelow';
		value: Record<string, string | number | boolean>;
		matchingColumns: never[];
		schema: Array<{
			displayName: string;
			display: boolean;
			required: boolean;
			id: string;
			defaultMatch: boolean;
			type: 'string' | 'number' | 'boolean';
		}>;
		attemptToConvertTypes: false;
		convertFieldsToString: false;
	};
};

export async function getLatestWordPressInstallInput({
	mittwaldApi,
	hostDomain,
	siteTitle,
}: {
	mittwaldApi: MittwaldApiClient;
	hostDomain: string;
	siteTitle: string;
}): Promise<WordPressInstallInput> {
	const app = await findWordPressApp(mittwaldApi);
	const version = await findLatestAppVersion(mittwaldApi, app.id);
	const versionDetails = await mittwaldApi.getAppVersionDetails(app.id, version.id);

	return {
		app,
		version,
		versionConfig: buildVersionConfig(versionDetails, {
			hostDomain,
			siteTitle,
		}),
	};
}

async function findWordPressApp(mittwaldApi: MittwaldApiClient): Promise<MittwaldApp> {
	const apps = await mittwaldApi.listApps();
	const app = apps.find((entry) => entry.name.toLowerCase().includes('wordpress'));
	if (!app) {
		throw new Error('Could not find WordPress app in /apps response');
	}

	return app;
}

async function findLatestAppVersion(
	mittwaldApi: MittwaldApiClient,
	appId: string,
): Promise<MittwaldAppVersion> {
	const versions = await mittwaldApi.listAppVersions(appId);
	if (versions.length === 0) {
		throw new Error('No app versions returned for WordPress');
	}

	const sortedVersions = [...versions].sort((a, b) =>
		compareVersions(a.externalVersion, b.externalVersion),
	);
	const latestVersion = sortedVersions[sortedVersions.length - 1];
	if (!latestVersion) {
		throw new Error('Could not determine the latest WordPress version');
	}

	return latestVersion;
}

function buildVersionConfig(
	versionDetails: MittwaldAppVersionDetails,
	{
		hostDomain,
		siteTitle,
	}: {
		hostDomain: string;
		siteTitle: string;
	},
): WordPressInstallInput['versionConfig'] {
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

	return {
		mappingMode: 'defineBelow',
		value,
		matchingColumns: [],
		schema: userInputs.map((input) => ({
			displayName: input.name,
			display: true,
			required: true,
			id: input.name,
			defaultMatch: false,
			type: normalizeDataType(input.dataType),
		})),
		attemptToConvertTypes: false,
		convertFieldsToString: false,
	};
}

function normalizeDataType(dataType: string | undefined): 'string' | 'number' | 'boolean' {
	if (dataType === 'number' || dataType === 'boolean') {
		return dataType;
	}

	return 'string';
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
