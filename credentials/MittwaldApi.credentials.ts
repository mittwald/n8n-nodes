import {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import { config } from '../nodes/Mittwald/shared/config';

export class MittwaldApi implements ICredentialType {
	// eslint-disable-next-line n8n-nodes-base/cred-class-field-display-name-miscased
	displayName = 'mittwald API';
	name = 'mittwaldApi';
	icon: Icon = 'file:../nodes/Mittwald/mittwald.svg';
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

	// Uses the same base URL as the node itself, so a token for a non-production
	// environment is not reported as invalid.
	test: ICredentialTestRequest = {
		request: {
			baseURL: config.apiBaseUrl,
			url: '/users/self/credentials/email',
			method: 'GET',
		},
	};
}
