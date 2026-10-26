/**
 * Serialises structured data for a <script type="application/ld+json"> tag.
 * "<" is escaped so text such as "</script>" in admin-edited content can never
 * break out of the tag and run as code.
 */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
