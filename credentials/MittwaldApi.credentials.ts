import {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import { config } from '../nodes/Mittwald/shared/config';

export class MittwaldApi implements ICredentialType {
	displayName = 'Mittwald API';
	name = 'mittwaldApi';
	icon: Icon = {
		light: 'file:../nodes/Mittwald/icon-light.svg',
		dark: 'file:../nodes/Mittwald/icon-dark.svg',
	};
	documentationUrl = 'https://developer.mittwald.de/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			placeholder: 'Your API Token',
			description: 'Enter your mittwald API token',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// Uses the same base URL as the node itself.
	test: ICredentialTestRequest = {
		request: {
			baseURL: config.apiBaseUrl,
			url: '/users/self/credentials/email',
			method: 'GET',
			headers: {
				'User-Agent': config.userAgent,
			},
		},
	};
}
