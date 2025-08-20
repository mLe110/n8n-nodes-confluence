import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ConfluenceCredentialsApi implements ICredentialType {
	name = 'confluenceCredentialsApi';
	displayName = 'Confluence Credentials API';

	documentationUrl = 'https://your-docs-url';

	properties: INodeProperties[] = [
		{
			displayName: 'APIM Subscription Key',
			name: 'apimSubscriptionKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'User Name',
			name: 'username',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{ $credentials.username }}',
				password: '={{ $credentials.password }}',
			},
			headers: {
				'Ocp-Apim-Subscription-Key': '={{ $credentials.apimSubscriptionKey }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://example.com/',
			url: '',
		},
	};
}
