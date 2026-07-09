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
		project: projectProperty,
		appInstallation: {
			...appInstallationProperty,
			required: true,
		},
		description: {
			displayName: 'Description',
			type: 'string',
			required: true,
			default: '',
		},
		interval: {
			displayName: 'Interval (Cron Expression)',
			type: 'string',
			required: true,
			default: '* * * * *',
		},
		active: {
			displayName: 'Active',
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
			type: 'string',
			default: '',
		},
		destinationType: {
			displayName: 'Destination',
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
