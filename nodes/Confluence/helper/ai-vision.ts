import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

export interface AIVisionConfig {
	provider: 'openai' | 'anthropic' | 'google' | 'custom';
	apiKey?: string;
	apiUrl?: string;
	model?: string;
	maxTokens?: number;
	temperature?: number;
}

/**
 * Generate description for an image using AI vision model
 * Returns a German description suitable for embedding in text
 */
export async function generateImageDescription(
	ctx: IExecuteFunctions,
	imageData: ArrayBuffer,
	filename: string,
	config: AIVisionConfig,
): Promise<string> {
	// Validate image data
	if (!imageData || imageData.byteLength === 0) {
		throw new Error(`Empty or invalid image data for file ${filename}`);
	}

	const base64Image = Buffer.from(imageData).toString('base64');
	const mimeType = getMimeTypeFromFilename(filename).trim();

	// Validate that we have a supported image format
	if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mimeType)) {
		throw new Error(`Unsupported image format: ${mimeType} for file ${filename}`);
	}

	// TODO Add azure open ai
	switch (config.provider) {
		case 'openai':
			return generateOpenAIDescription(ctx, base64Image, mimeType, config, filename);
		case 'anthropic':
			return generateAnthropicDescription(ctx, base64Image, mimeType, config, filename);
		case 'google':
			return generateGoogleDescription(ctx, base64Image, mimeType, config, filename);
		case 'custom':
			return generateCustomDescription(ctx, base64Image, mimeType, config, filename);
		default:
			throw new Error(`Unsupported AI vision provider: ${config.provider}`);
	}
}

async function generateOpenAIDescription(
	ctx: IExecuteFunctions,
	base64Image: string,
	mimeType: string,
	config: AIVisionConfig,
	filename?: string,
): Promise<string> {
	const options: IHttpRequestOptions = {
		method: 'POST',
		url: config.apiUrl || 'https://api.openai.com/v1/chat/completions',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${config.apiKey}`,
		},
		json: true,
		body: {
			model: config.model || 'gpt-4o',
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: 'Beschreibe dieses Bild auf Deutsch in 1-2 prägnanten Sätzen. Fokussiere auf die wichtigsten visuellen Elemente, die für das Verständnis des Inhalts relevant sind. Beginne nicht mit "Das Bild zeigt" oder ähnlichen Phrasen.',
						},
						{
							type: 'image_url',
							image_url: {
								url: `data:${mimeType};base64,${base64Image}`,
							},
						},
					],
				},
			],
			max_tokens: config.maxTokens || 150,
			temperature: config.temperature || 0.3,
		},
	};

	try {
		const response = await ctx.helpers.request(options);
		return (
			response.choices?.[0]?.message?.content?.trim() || 'Bild konnte nicht beschrieben werden.'
		);
	} catch (error: any) {
		console.error('OpenAI Vision API Error:', {
			error: error.message,
			status: error.response?.status,
			data: error.response?.data,
			filename: filename || 'unknown',
			mimeType: mimeType,
		});
		throw error;
	}
}

async function generateAnthropicDescription(
	ctx: IExecuteFunctions,
	base64Image: string,
	mimeType: string,
	config: AIVisionConfig,
	filename?: string,
): Promise<string> {
	const options: IHttpRequestOptions = {
		method: 'POST',
		url: config.apiUrl || 'https://api.anthropic.com/v1/messages',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': config.apiKey,
			'anthropic-version': '2023-06-01',
		},
		json: true,
		body: {
			model: config.model || 'claude-3-sonnet-20240229',
			max_tokens: config.maxTokens || 150,
			temperature: config.temperature || 0.3,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: 'Beschreibe dieses Bild auf Deutsch in 1-2 prägnanten Sätzen. Fokussiere auf die wichtigsten visuellen Elemente, die für das Verständnis des Inhalts relevant sind. Beginne nicht mit "Das Bild zeigt" oder ähnlichen Phrasen.',
						},
						{
							type: 'image',
							source: {
								type: 'base64',
								media_type: mimeType,
								data: base64Image,
							},
						},
					],
				},
			],
		},
	};

	const response = await ctx.helpers.request(options);
	return response.content?.[0]?.text?.trim() || 'Bild konnte nicht beschrieben werden.';
}

async function generateGoogleDescription(
	ctx: IExecuteFunctions,
	base64Image: string,
	mimeType: string,
	config: AIVisionConfig,
	filename?: string,
): Promise<string> {
	const options: IHttpRequestOptions = {
		method: 'POST',
		url:
			config.apiUrl ||
			`https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-pro-vision'}:generateContent?key=${config.apiKey}`,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
		body: {
			contents: [
				{
					parts: [
						{
							text: 'Beschreibe dieses Bild auf Deutsch in 1-2 prägnanten Sätzen. Fokussiere auf die wichtigsten visuellen Elemente, die für das Verständnis des Inhalts relevant sind. Beginne nicht mit "Das Bild zeigt" oder ähnlichen Phrasen.',
						},
						{
							inline_data: {
								mime_type: mimeType,
								data: base64Image,
							},
						},
					],
				},
			],
			generationConfig: {
				maxOutputTokens: config.maxTokens || 150,
				temperature: config.temperature || 0.3,
			},
		},
	};

	const response = await ctx.helpers.request(options);
	return (
		response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
		'Bild konnte nicht beschrieben werden.'
	);
}

async function generateCustomDescription(
	ctx: IExecuteFunctions,
	base64Image: string,
	mimeType: string,
	config: AIVisionConfig,
	filename?: string,
): Promise<string> {
	// For custom endpoints, use a generic format
	const options: IHttpRequestOptions = {
		method: 'POST',
		url: config.apiUrl!,
		headers: {
			'Content-Type': 'application/json',
			...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
		},
		json: true,
		body: {
			image: base64Image,
			mimeType,
			prompt:
				'Beschreibe dieses Bild auf Deutsch in 1-2 prägnanten Sätzen. Fokussiere auf die wichtigsten visuellen Elemente, die für das Verständnis des Inhalts relevant sind. Beginne nicht mit "Das Bild zeigt" oder ähnlichen Phrasen.',
			maxTokens: config.maxTokens || 150,
			temperature: config.temperature || 0.3,
		},
	};

	const response = await ctx.helpers.request(options);
	return (
		response.description?.trim() || response.text?.trim() || 'Bild konnte nicht beschrieben werden.'
	);
}

function getMimeTypeFromFilename(filename: string): string {
	const ext = filename.toLowerCase().split('.').pop();
	switch (ext) {
		case 'png':
			return 'image/png';
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'gif':
			return 'image/gif';
		case 'webp':
			return 'image/webp';
		case 'bmp':
			return 'image/bmp';
		case 'svg':
			return 'image/svg+xml';
		default:
			return 'image/png'; // fallback
	}
}
