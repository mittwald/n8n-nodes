import {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class Mittwald implements ICredentialType {
	name = 'mittwaldApi';
	displayName = 'mittwald API';
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

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.mittwald.de',
			url: '/v2/users/self/credentials/email',
			method: 'GET',
		},
	};
}
