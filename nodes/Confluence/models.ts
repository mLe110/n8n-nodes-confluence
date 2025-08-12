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
