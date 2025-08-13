import { z } from 'zod';

// Zod schemas to validate Confluence responses
export const spaceSchema = z.object({
	id: z.number(),
	key: z.string(),
	name: z.string(),
	type: z.string(),
	_links: z
		.object({
			webui: z.string().optional(),
			self: z.string().optional(),
		})
		.optional(),
});

export const spacePageSchema = z.object({
	results: z.array(spaceSchema),
	start: z.number().optional(),
	limit: z.number().optional(),
	size: z.number().optional(),
	_links: z.unknown().optional(),
});

export type Space = z.infer<typeof spaceSchema>;
export type SpacePage = z.infer<typeof spacePageSchema>;

// Content schemas
export const storageBodySchema = z.object({
	value: z.string(),
	representation: z.string().optional(),
	_expandable: z.unknown().optional(),
});

export const contentBodySchema = z.object({
	storage: storageBodySchema,
	_expandable: z.unknown().optional(),
});

export const linkSchema = z.object({
	webui: z.string(),
});

export const contentPageSchema = z.object({
	id: z.string(),
	type: z.literal('page').or(z.string()),
	status: z.string().optional(),
	title: z.string(),
	body: contentBodySchema,
	_links: linkSchema,
	_expandable: z.unknown().optional(),
});

export const spaceContentEnvelopeSchema = z.object({
	page: z.object({
		results: z.array(contentPageSchema),
		start: z.number().optional(),
		limit: z.number().optional(),
		size: z.number().optional(),
		_links: z
			.object({ self: z.string().optional(), next: z.string().optional() })
			.partial()
			.optional(),
	}),
	blogpost: z
		.object({
			results: z.array(z.unknown()),
			start: z.number().optional(),
			limit: z.number().optional(),
			size: z.number().optional(),
			_links: z.unknown().optional(),
		})
		.optional(),
	_links: z.unknown().optional(),
});

export type ContentPage = z.infer<typeof contentPageSchema>;
export type SpaceContentEnvelope = z.infer<typeof spaceContentEnvelopeSchema>;

// Parsed shape for node items when returning page content (clean + html)
export const parsedPageSchema = z.object({
	spaceKey: z.string(),
	spaceName: z.string().optional().default(''),
	id: z.string(),
	title: z.string(),
	body: z.string(), // storage HTML
	plainText: z.string(), // cleaned plaintext for embeddings/search
	webuiLink: z.string().optional().default(''),
});
export type ParsedPage = z.infer<typeof parsedPageSchema>;
