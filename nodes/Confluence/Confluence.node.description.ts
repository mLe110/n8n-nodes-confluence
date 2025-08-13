import type { INodeProperties } from 'n8n-workflow';

export const spaceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['space'],
			},
		},
		options: [
			{
				name: 'Get Spaces',
				value: 'getSpaces',
				action: 'Get spaces for user',
			},
			{
				name: 'Get Space Content',
				value: 'getSpaceContent',
				action: 'Get space content',
			},
		],
		default: 'getSpaces',
	},
];

export const spaceFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                              space: getSpaceContent                        */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Space Key',
		name: 'spaceKey',
		type: 'string',
		description:
			'Get content (incl. images in text) from the given space. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		default: '',
		required: true,
		displayOptions: {
			show: {
				operation: ['getSpaceContent'],
				resource: ['space'],
			},
		},
	},
	{
		displayName: 'Space Name',
		name: 'spaceName',
		type: 'string',
		description: 'Provide the name of the space so it can be attached to the output',
		default: '',
		displayOptions: {
			show: {
				operation: ['getSpaceContent'],
				resource: ['space'],
			},
		},
	},
	/* -------------------------------------------------------------------------- */
	/*                           Image Processing Options                         */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Process Images',
		name: 'processImages',
		type: 'boolean',
		default: false,
		description:
			'Whether to extract images from pages, generate AI descriptions, and replace image tags with descriptions',
		displayOptions: {
			show: {
				operation: ['getSpaceContent'],
				resource: ['space'],
			},
		},
	},
	{
		displayName: 'AI Vision Provider',
		name: 'aiProvider',
		type: 'options',
		default: 'openai',
		options: [
			{
				name: 'OpenAI GPT-4 Vision',
				value: 'openai',
			},
			{
				name: 'Anthropic Claude 3',
				value: 'anthropic',
			},
			{
				name: 'Google Gemini Vision',
				value: 'google',
			},
			{
				name: 'Custom API',
				value: 'custom',
			},
		],
		description: 'AI service to use for generating image descriptions',
		displayOptions: {
			show: {
				operation: ['getSpaceContent'],
				resource: ['space'],
				processImages: [true],
			},
		},
	},
	{
		displayName: 'API Key',
		name: 'aiApiKey',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		description: 'API key for the AI vision service',
		displayOptions: {
			show: {
				operation: ['getSpaceContent'],
				resource: ['space'],
				processImages: [true],
			},
		},
	},
	{
		displayName: 'AI Model',
		name: 'aiModel',
		type: 'string',
		default: '',
		placeholder: 'gpt-4o, claude-3-sonnet-20240229, gemini-pro-vision',
		description: 'Specific model to use (leave empty for provider default)',
		displayOptions: {
			show: {
				operation: ['getSpaceContent'],
				resource: ['space'],
				processImages: [true],
			},
		},
	},
	{
		displayName: 'Custom API URL',
		name: 'aiApiUrl',
		type: 'string',
		default: '',
		placeholder: 'https://api.example.com/v1/vision',
		description: 'Custom API endpoint URL (required for custom provider)',
		displayOptions: {
			show: {
				operation: ['getSpaceContent'],
				resource: ['space'],
				processImages: [true],
				aiProvider: ['custom'],
			},
		},
	},
];
