import appInstallationProperty from '../../shared/appInstallationProperty';
import projectProperty from '../../shared/projectProperty';
import { cronjobResource } from '../resource';
import Z from 'zod';

const cronjobDestinationSchema = Z.union([
	Z.object({
		interpreter: Z.string().min(1),
		path: Z.string().min(1),
		parameters: Z.string().optional(),
	}),
	Z.object({
		url: Z.string().url(),
	}),
]);

export default cronjobResource
	.addOperation({
		name: 'Create',
		action: 'Create a cronjob',
		description: 'Create a new cronjob in a project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		appInstallation: {
			...appInstallationProperty,
			required: true,
		},
		description: {
			displayName: 'Name',
			description: 'Human-readable name of the cronjob',
			type: 'string',
			required: true,
			default: '',
		},
		interval: {
			displayName: 'Interval (Cron Expression)',
			description: 'Execution schedule as a cron expression, for example 0 3 * * *',
			type: 'string',
			required: true,
			default: '* * * * *',
		},
		active: {
			displayName: 'Active',
			description: 'Whether the cronjob runs on its schedule',
			type: 'boolean',
			default: true,
		},
		timeout: {
			displayName: 'Timeout',
			description: 'Maximum execution time in seconds',
			type: 'number',
			default: 3600,
		},
		email: {
			displayName: 'Email',
			description: 'Optional address that receives a notification for every execution',
			type: 'string',
			default: '',
		},
		destinationType: {
			displayName: 'Destination',
			description: 'Whether the cronjob runs a shell command or calls an HTTP URL',
			type: 'options',
			default: 'shell',
			options: [
				{
					name: 'Shell Command',
					value: 'shell',
				},
				{
					name: 'HTTP URL',
					value: 'url',
				},
			],
		},
		interpreter: {
			displayName: 'Interpreter',
			description: 'Absolute path to the interpreter that runs the script',
			type: 'string',
			required: true,
			default: '/usr/bin/php',
			displayOptions: {
				show: {
					destinationType: ['shell'],
				},
			},
		},
		path: {
			displayName: 'Path',
			description: 'Path to the script to run, relative to the app installation',
			type: 'string',
			required: true,
			default: '',
			displayOptions: {
				show: {
					destinationType: ['shell'],
				},
			},
		},
		parameters: {
			displayName: 'Parameters',
			description: 'Optional arguments passed to the script',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					destinationType: ['shell'],
				},
			},
		},
		url: {
			displayName: 'URL',
			description: 'URL to call when the cronjob runs',
			type: 'string',
			required: true,
			default: '',
			displayOptions: {
				show: {
					destinationType: ['url'],
				},
			},
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const {
			project,
			description,
			interval,
			active,
			timeout,
			email,
			destinationType,
			interpreter,
			path,
			parameters,
			url,
			appInstallation,
		} = properties;

		const destination =
			destinationType === 'url'
				? {
						url,
					}
				: {
						interpreter,
						path,
						parameters: parameters ? parameters : undefined,
					};

		return apiClient.request({
			path: `/projects/${project}/cronjobs`,
			method: 'POST',
			requestSchema: Z.object({
				description: Z.string().min(1),
				interval: Z.string().min(1),
				active: Z.boolean(),
				timeout: Z.number().int().min(1).max(86400),
				email: Z.string().email().optional(),
				destination: cronjobDestinationSchema,
				appId: Z.string().min(1),
			}),
			responseSchema: Z.object({
				id: Z.string().uuid(),
			}),
			body: {
				description,
				interval,
				active,
				timeout,
				email: email ? email : undefined,
				destination,
				appId: appInstallation,
			},
		});
	});
