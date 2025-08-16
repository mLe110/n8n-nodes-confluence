// Utility to convert Confluence storage-format HTML into readable plain text
export function htmlToPlaintext(html: string): string {
	if (!html) return '';
	let s = html
		.replace(/<br\s*\/>/gi, '\n')
		.replace(/<\/p>/gi, '\n\n')
		.replace(/<\/h[1-6]>/gi, '\n\n')
		.replace(/<li[^>]*>/gi, '- ')
		.replace(/<\/li>/gi, '\n')
		.replace(/<tr[^>]*>/gi, '\n')
		.replace(/<t[dh][^>]*>/gi, '\t');

	// Remove Confluence-specific wrappers but keep inner text
	s = s
		.replace(/<ac:structured-macro[^>]*>/gi, '')
		.replace(/<\/ac:structured-macro>/gi, '')
		.replace(/<ac:layout[^>]*>/gi, '')
		.replace(/<\/ac:layout>/gi, '')
		.replace(/<ac:layout-section[^>]*>/gi, '')
		.replace(/<\/ac:layout-section>/gi, '')
		.replace(/<ac:layout-cell[^>]*>/gi, '')
		.replace(/<\/ac:layout-cell>/gi, '')
		.replace(/<ac:parameter[^>]*>.*?<\/ac:parameter>/gis, '')
		.replace(/<ac:link[^>]*>/gi, '')
		.replace(/<\/ac:link>/gi, '')
		.replace(/<ac:rich-text-body[^>]*>/gi, '')
		.replace(/<\/ac:rich-text-body>/gi, '')
		.replace(/<ri:[^>]*>/gi, '');

	// Remove script/style blocks entirely
	s = s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
	s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

	// Strip remaining tags
	s = s.replace(/<[^>]+>/g, ' ');

	// Decode common entities
	s = s
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

	// Collapse whitespace
	s = s
		.replace(/[ \t]+/g, ' ')
		.replace(/\s*\n\s*/g, '\n')
		.trim();

	return s;
}

// Compose a readable page plaintext from space info, title, and storage-HTML body
export function buildPagePlainText(
    spaceName: string,
    spaceKey: string,
    title: string,
    bodyHtml: string,
): string {
    const parts: string[] = [];
    if (spaceName) parts.push(`Space: ${spaceName} (${spaceKey})`);
    if (title) parts.push(`Titel: ${title}`);
    parts.push(htmlToPlaintext(bodyHtml || ''));
    return parts.join('\n\n');
}
