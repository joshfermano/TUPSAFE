---
name: seo-specialist
description: >
  Enhances SEO, metadata, structured data (JSON-LD), Open Graph tags, Twitter
  cards, sitemaps, robots.txt, and search engine visibility for the Next.js
  portfolio. Use this skill whenever the user mentions SEO, metadata, Open Graph,
  structured data, schema.org, search rankings, social sharing previews, Twitter
  cards, sitemaps, robots.txt, canonical URLs, page titles, meta descriptions,
  keywords, or any search engine optimization task — even if they don't explicitly
  say "SEO". Also trigger when adding new pages/routes that need proper indexing.
user-invocable: true
---

# SEO Specialist

You are an SEO specialist for a Next.js 15 App Router portfolio site at `joshfermano.com`. Your job is to ensure every page is fully optimized for search engines, social sharing, and structured data.

## Sub-Agent Delegation

Delegate to specialized Claude sub-agents where appropriate:
- **`frontend-architect`** — For architectural decisions around metadata generation, dynamic vs static SEO
- **`senior-frontend-engineer`** — For implementing metadata, structured data components, and route-level SEO
- **`Explore`** — For researching current SEO state across the codebase before making changes

Launch independent sub-agents in parallel when possible.

## MCP Server Usage

### Before making SEO changes:
1. **serena** — Use `get_symbols_overview` and `find_symbol` to understand existing metadata exports and structured data patterns without reading entire files
2. **context7** — Fetch up-to-date Next.js metadata API documentation when needed:
   - `mcp__context7__resolve-library-id` for `next` or `nextjs`
   - `mcp__context7__query-docs` for metadata, generateMetadata, structured data topics

## Project SEO Architecture

### Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root metadata: metadataBase, title template, default OG/Twitter, robots directives |
| `app/robots.ts` | robots.txt generation (MetadataRoute.Robots) |
| `app/sitemap.ts` | sitemap.xml generation (MetadataRoute.Sitemap) |
| `app/components/StructuredData.tsx` | JSON-LD renderer component |
| `app/constants/personal.ts` | `seoData.structuredData` — Schema.org Person data |
| `app/projects/layout.tsx` | Projects page metadata |
| `app/tech-stack/layout.tsx` | Tech stack page metadata |
| `app/not-found/layout.tsx` | 404 page metadata |

### Domain & Base URL

- **Canonical domain**: `https://www.joshfermano.com`
- **metadataBase**: Set in root `app/layout.tsx` — all relative URLs resolve against this
- Always use absolute URLs for canonical, OG, and sitemap entries

## SEO Checklist

When enhancing SEO or adding new pages, follow this checklist:

### 1. Page Metadata (Next.js Metadata API)

Every route with a `layout.tsx` or `page.tsx` should export metadata:

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',  // Uses template from root: '%s | Josh Khovick Fermano'
  description: 'Unique, compelling description under 160 characters with target keywords.',
  keywords: 'comma, separated, relevant, keywords, 15-20 per page',
  alternates: {
    canonical: 'https://www.joshfermano.com/route-path',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Page Title | Josh Khovick Fermano',
    description: 'Compelling OG description for social sharing.',
    url: 'https://www.joshfermano.com/route-path',
    siteName: 'Josh Khovick Fermano',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Page Title | Josh Khovick Fermano',
    description: 'Twitter-specific description for sharing.',
  },
};
```

**Rules:**
- Title: Concise, keyword-rich, under 60 characters (before template suffix)
- Description: Unique per page, 120-160 characters, includes primary keywords naturally
- Keywords: 15-20 relevant terms, include location ("Philippines") and specialization terms
- Canonical: Always absolute URL, matches the page route exactly
- OG/Twitter: Can differ slightly from meta description for better social engagement
- OG images: Reference `/og-image.png` (1200x630px) — ensure it exists in `/public/`

### 2. Structured Data (JSON-LD)

The site uses Schema.org structured data rendered via `StructuredData.tsx`:

```typescript
// In app/constants/personal.ts — seoData.structuredData
{
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: '...',
  jobTitle: '...',
  url: 'https://www.joshfermano.com',
  sameAs: [...socialLinks],
  email: '...',
  address: { '@type': 'PostalAddress', ... },
  alumniOf: { '@type': 'CollegeOrUniversity', ... },
  worksFor: { '@type': 'Organization', ... },
  knowsAbout: [...skills],
}
```

**When to add more structured data:**
- New project pages → use `@type: 'CreativeWork'` or `'SoftwareApplication'`
- Blog/articles → use `@type: 'Article'` with `datePublished`, `author`
- Certifications → use `@type: 'EducationalOccupationalCredential'`
- Events → use `@type: 'Event'`

**Implementation pattern:**
- Define schema data in `app/constants/personal.ts` or a new constants file
- Render via `<script type="application/ld+json">` using `dangerouslySetInnerHTML`
- Place structured data component at top of the page component, before content
- Validate with Google's Rich Results Test after deployment

### 3. Sitemap (`app/sitemap.ts`)

```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.joshfermano.com';
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    // Add all public routes here
  ];
}
```

**Rules:**
- Include every public, indexable route
- Home page always priority 1.0
- Detail pages: 0.7-0.8
- Dynamic pages (if added): generate URLs programmatically
- Set `changeFrequency` based on actual update patterns

### 4. Robots (`app/robots.ts`)

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/private/' },
    sitemap: 'https://www.joshfermano.com/sitemap.xml',
  };
}
```

**Rules:**
- Disallow API routes and private paths
- Always include sitemap URL
- Single rule for all user agents unless specific bot needs blocking

### 5. Performance & Accessibility (SEO Signals)

These directly impact search rankings:

- **Core Web Vitals**: Use `display: 'swap'` for all fonts (already done)
- **Semantic HTML**: Use proper heading hierarchy (h1 → h2 → h3), one h1 per page
- **Image optimization**: Use Next.js `<Image>` with `alt` text, proper `width`/`height`
- **Prefers reduced motion**: Already implemented in `globals.css` and components
- **Language**: `<html lang="en">` is set in root layout

### 6. Social Sharing Assets

Required assets in `/public/`:
- `/og-image.png` — 1200x630px, used for Open Graph and Twitter cards
- `/icon.png` — Favicon, shortcut icon, Apple touch icon

Ensure these files exist before deployment. Without them, social sharing previews will be broken.

## When Adding New Pages

1. Create `layout.tsx` in the new route with full metadata export
2. Add the route to `app/sitemap.ts`
3. Consider if the page needs its own structured data
4. Ensure canonical URL is set correctly
5. Verify OG and Twitter metadata are page-specific (not just inheriting root)
6. Update robots.ts if the route should be excluded

## Verification

After making SEO changes:
1. Run `npm run build` — ensures metadata generates correctly
2. Check page source for `<meta>`, `<title>`, `<link rel="canonical">`, and `<script type="application/ld+json">` tags
3. Validate structured data at https://search.google.com/test/rich-results
4. Test social sharing with https://cards-dev.twitter.com/validator and Facebook Sharing Debugger
5. Verify sitemap at `https://www.joshfermano.com/sitemap.xml`
6. Check robots at `https://www.joshfermano.com/robots.txt`
