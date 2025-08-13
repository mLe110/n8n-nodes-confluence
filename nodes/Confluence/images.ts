import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import type { Attachment, ImageReference } from './models';
import { attachmentPageSchema } from './models';
import { parseOrThrow } from './validation';

/**
 * Extract image references from Confluence storage HTML
 * Looks for <ac:image> tags with <ri:attachment ri:filename="..."> inside
 */
export function extractImageReferences(html: string): ImageReference[] {
	if (!html) return [];

	const images: ImageReference[] = [];

	// Match <ac:image>...</ac:image> blocks
	const imageTagRegex = /<ac:image[^>]*>.*?<\/ac:image>/gis;
	const imageMatches = html.match(imageTagRegex) || [];

	for (const imageTag of imageMatches) {
		// Extract filename from <ri:attachment ri:filename="...">
		const filenameMatch = imageTag.match(/ri:filename="([^"]+)"/i);
		if (filenameMatch) {
			images.push({
				filename: filenameMatch[1],
				originalTag: imageTag,
			});
		}
	}

	return images;
}

/**
 * Fetch all attachments for a given page ID
 */
export async function fetchPageAttachments(
	ctx: IExecuteFunctions,
	baseUrl: string,
	pageId: string,
	itemIndex: number,
): Promise<Attachment[]> {
	const options: IHttpRequestOptions = {
		headers: { Accept: 'application/json' },
		method: 'GET',
		url: `${baseUrl}/rest/api/content/${encodeURIComponent(pageId)}/child/attachment`,
		json: true,
	};

	const raw = await ctx.helpers.requestWithAuthentication.call(
		ctx,
		'confluenceCredentialsApi',
		options,
	);

	const parsed = parseOrThrow(
		ctx,
		attachmentPageSchema,
		raw,
		`Failed to fetch attachments for page ${pageId}.`,
		itemIndex,
	);

	return parsed.results;
}

/**
 * Match image references to attachments by filename
 */
export function matchImagesToAttachments(
	imageRefs: ImageReference[],
	attachments: Attachment[],
): ImageReference[] {
	return imageRefs.map((img) => {
		const attachment = attachments.find((att) => att.title === img.filename);
		return {
			...img,
			attachmentId: attachment?.id,
		};
	});
}

/**
 * Download an image from Confluence
 * Returns base64-encoded image data
 */
export async function downloadImage(
	ctx: IExecuteFunctions,
	baseUrl: string,
	downloadPath: string,
): Promise<ArrayBuffer> {
	const options: IHttpRequestOptions = {
		headers: { Accept: 'image/*' },
		method: 'GET',
		url: `${baseUrl}${downloadPath}`,
		json: false,
		encoding: null as any, // Force Buffer return to preserve binary data
	};

	try {
		const imageData = await ctx.helpers.requestWithAuthentication.call(
			ctx,
			'confluenceCredentialsApi',
			options,
		);

		if (!Buffer.isBuffer(imageData)) {
			throw new Error(`Expected Buffer but received ${typeof imageData}`);
		}

		if (imageData.length === 0) {
			throw new Error(`Received empty image data from ${options.url}`);
		}

		// Convert Buffer to ArrayBuffer
		return imageData.buffer.slice(
			imageData.byteOffset,
			imageData.byteOffset + imageData.byteLength,
		);
	} catch (error) {
		throw new Error(`Failed to download image from ${options.url}: ${error}`);
	}
}

/**
 * Replace image tags in HTML with AI-generated descriptions
 */
export function replaceImageTagsWithDescriptions(
	html: string,
	imageRefs: ImageReference[],
): string {
	let processedHtml = html;

	for (const img of imageRefs) {
		if (img.description) {
			// Replace the original image tag with the description wrapped in a span
			processedHtml = processedHtml.replace(
				img.originalTag,
				`<span class="image-description">[Bild: ${img.description}]</span>`,
			);
		}
	}

	return processedHtml;
}

/**
 * Check if an attachment is an image based on media type
 */
export function isImageAttachment(attachment: Attachment): boolean {
	const mediaType = attachment.metadata?.mediaType || attachment.extensions?.mediaType || '';
	return mediaType.startsWith('image/');
}
