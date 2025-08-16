import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { z } from 'zod';

export function parseOrThrow<T extends z.ZodTypeAny>(
	ctx: IExecuteFunctions,
	schema: T,
	raw: unknown,
	message: string,
	itemIndex: number,
): z.infer<T> {
	const parsed = schema.safeParse(raw);
	if (!parsed.success) {
		const formatted = parsed.error.errors
			.map((e) => `${e.path.join('.') || '(root)'}: ${e.message}`)
			.join('\n');
		throw new NodeOperationError(ctx.getNode(), `${message}\n${formatted}`, {
			itemIndex,
		});
	}
	return parsed.data as z.infer<T>;
}
