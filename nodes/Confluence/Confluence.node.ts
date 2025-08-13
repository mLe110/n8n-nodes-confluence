import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { spaceFields, spaceOperations } from './Confluence.node.description';
import { spacePageSchema, spaceContentEnvelopeSchema, type ParsedPage } from './models';
import { buildPagePlainText } from './transformations';
import { parseOrThrow } from './validation';
import {
	extractImageReferences,
	fetchPageAttachments,
	matchImagesToAttachments,
	downloadImage,
	replaceImageTagsWithDescriptions,
	isImageAttachment,
} from './images';
import { generateImageDescription, type AIVisionConfig } from './ai-vision';

export class Confluence implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Confluence',
		name: 'confluence',
		icon: 'file:Confluence.svg',
		group: ['input'],
		version: 1,
		description: 'Confluence datacenter node',
		defaults: {
			name: 'Confluence',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'confluenceCredentialsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Base URL',
				name: 'baseUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'The base URL of your Confluence instance',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Space',
						value: 'space',
					},
				],
				default: 'space',
			},
			...spaceOperations,
			...spaceFields,
		],
	};
	helpers: any;

	// Zod schemas moved to `nodes/Confluence/models.ts`

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const baseUrl = this.getNodeParameter('baseUrl', 0);
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		const returnData: INodeExecutionData[] = [];

		if (resource === 'space') {
			if (operation === 'getSpaces') {
				const limit = 50;
				let start = 0;
				while (true) {
					const options: IHttpRequestOptions = {
						headers: { Accept: 'application/json' },
						method: 'GET',
						url: `${baseUrl}/rest/api/space`,
						json: true,
						qs: { limit, start },
					};
					const pageRaw = await this.helpers.requestWithAuthentication.call(
						this,
						'confluenceCredentialsApi',
						options,
					);

					const parsed = parseOrThrow(
						this,
						spacePageSchema,
						pageRaw,
						'Invalid response from Confluence API while fetching spaces.',
						0,
					);

					const spaces = parsed.results;
					for (const s of spaces) {
						returnData.push({
							json: {
								id: s.id,
								key: s.key,
								name: s.name,
								type: s.type,
								_links: {
									webui: s._links?.webui,
									self: s._links?.self,
								},
							},
						});
					}

					// advance or stop
					//const pageCount = spaces.length;
					//if (pageCount < limit) break;
					//start += pageCount;
					break;
				}
			}
			if (operation === 'getSpaceContent') {
				for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
					try {
						const spaceKey = this.getNodeParameter('spaceKey', itemIndex, '') as string;
						const spaceName = this.getNodeParameter('spaceName', itemIndex, '') as string;
						const processImages = this.getNodeParameter(
							'processImages',
							itemIndex,
							false,
						) as boolean;

						// Image processing configuration
						let aiConfig: AIVisionConfig | null = null;
						if (processImages) {
							aiConfig = {
								provider: this.getNodeParameter('aiProvider', itemIndex, 'openai') as any,
								apiKey: this.getNodeParameter('aiApiKey', itemIndex, '') as string,
								model: this.getNodeParameter('aiModel', itemIndex, '') as string,
								apiUrl: this.getNodeParameter('aiApiUrl', itemIndex, '') as string,
								maxTokens: 150,
								temperature: 0.3,
							};
						}
						const item = items[itemIndex];
						(this as any).logger?.info?.('Confluence: getSpaceContent', {
							node: this.getNode().name,
						});
						(this as any).logger?.debug?.(`Confluence: getSpaceContent for space ${spaceKey}`);

						const limit = 100;
						let start = 0;
						const pages: ParsedPage[] = [];

						while (true) {
							const options: IHttpRequestOptions = {
								headers: { Accept: 'application/json' },
								method: 'GET',
								url: `${baseUrl}/rest/api/space/${encodeURIComponent(spaceKey)}/content`,
								json: true,
								qs: { expand: 'body.storage', limit, start },
							};

							(this as any).logger?.debug?.(`Confluence: getSpaceContent for space ${spaceKey}`);

							const raw = await this.helpers.requestWithAuthentication.call(
								this,
								'confluenceCredentialsApi',
								options,
							);

							const parsed = parseOrThrow(
								this,
								spaceContentEnvelopeSchema,
								raw,
								'Invalid response from Confluence API while fetching space content.',
								itemIndex,
							);

							const parsedPages = parsed.page.results;
							(this as any).logger?.debug?.(`Pages found: ${parsedPages.length}`);

							for (const p of parsedPages) {
								let processedBody = p.body.storage.value || '';

								// Process images if enabled
								if (processImages && aiConfig) {
									try {
										(this as any).logger?.debug?.(`Processing images for page ${p.id}`);

										const imageRefs = extractImageReferences(processedBody);
										if (imageRefs.length > 0) {
											(this as any).logger?.debug?.(
												`Found ${imageRefs.length} images in page ${p.id}`,
											);

											const attachments = await fetchPageAttachments(
												this,
												baseUrl as string,
												p.id,
												itemIndex,
											);
											const imageAttachments = attachments.filter(isImageAttachment);

											const matchedImages = matchImagesToAttachments(imageRefs, imageAttachments);

											for (const img of matchedImages) {
												if (img.attachmentId) {
													const attachment = imageAttachments.find(
														(a) => a.id === img.attachmentId,
													);
													if (attachment) {
														try {
															(this as any).logger?.debug?.(`Downloading image: ${img.filename}`);
															const imageData = await downloadImage(
																this,
																baseUrl as string,
																attachment._links.download || '',
															);
															(this as any).logger?.debug?.(
																`Generating description for: ${img.filename || 'unknown'}`,
															);
															img.description = await generateImageDescription(
																this,
																imageData,
																img.filename,
																aiConfig!,
															);
															(this as any).logger?.debug?.(
																`Generated description: ${img.description}`,
															);
														} catch (imgError) {
															(this as any).logger?.warn?.(
																`Failed to process image ${img.filename}:`,
																imgError,
															);
															img.description = `Bild: ${img.filename} (Beschreibung nicht verfügbar)`;
														}
													}
												} else {
													img.description = `Bild: ${img.filename} (Anhang nicht gefunden)`;
												}
											}

											processedBody = replaceImageTagsWithDescriptions(
												processedBody,
												matchedImages,
											);
										}
									} catch (imgProcessError) {
										(this as any).logger?.warn?.(
											`Failed to process images for page ${p.id}:`,
											imgProcessError,
										);
									}
								}

								const plainText = buildPagePlainText(
									spaceName || '',
									spaceKey || '',
									p.title || '',
									processedBody,
								);

								pages.push({
									spaceKey,
									spaceName,
									id: p.id,
									title: p.title,
									body: p.body.storage.value, // Keep original HTML
									plainText, // Use processed plain text
									webuiLink: p._links.webui,
								});
							}

							const count = parsedPages.length;
							if (count < limit) break;
							start += count;
						}

						item.json.content = pages;
					} catch (error) {
						if (this.continueOnFail()) {
							items.push({
								json: this.getInputData(itemIndex)[0].json,
								error,
								pairedItem: itemIndex,
							});
						} else {
							if ((error as any).context) {
								(error as any).context.itemIndex = itemIndex;
								throw error;
							}
							throw new NodeOperationError(this.getNode(), error as Error, {
								itemIndex,
							});
						}
					}
				}
				return [items];
			}
		}

		return [returnData];
	}
}
