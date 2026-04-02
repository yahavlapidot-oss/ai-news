import Anthropic from '@anthropic-ai/sdk';
import { AIAnalysis, Category } from './types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const VALID_CATEGORIES: Category[] = [
  'llms', 'robotics', 'startups', 'research', 'tools', 'regulation', 'other',
];

const SYSTEM_PROMPT = `You are an expert AI industry analyst. Your job is to analyze AI-related articles and extract structured insights. Always respond with valid JSON only — no markdown, no extra text.`;

const USER_PROMPT_TEMPLATE = (title: string, content: string) => `
Analyze this AI news article and return a JSON object with these exact fields:

Title: ${title}

Content:
${content}

Return JSON:
{
  "summary": "2-3 sentence summary of what happened and why it matters",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "category": "llms|robotics|startups|research|tools|regulation|other",
  "importanceScore": <integer 1-10>,
  "importanceReason": "one sentence explaining the score",
  "isBreakthrough": <true|false>,
  "relatedTopics": ["topic1", "topic2"]
}

Scoring guide:
9-10: Major breakthrough, paradigm shift, landmark paper or product
7-8: Significant development, important funding, notable research
5-6: Interesting development with moderate industry impact
3-4: Minor update, incremental improvement
1-2: Low relevance, hype without substance

Categories:
- llms: Language models, foundation models, training techniques
- robotics: Physical AI, autonomous systems, humanoid robots
- startups: Funding rounds, acquisitions, company news
- research: Academic papers, benchmarks, scientific findings
- tools: APIs, developer tools, open source releases, products
- regulation: Policy, law, safety, ethics, governance
- other: Anything else
`.trim();

export async function analyzeArticle(
  title: string,
  content: string
): Promise<AIAnalysis> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', // Use Haiku for cost efficiency on bulk processing
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: USER_PROMPT_TEMPLATE(title, content),
      },
    ],
  });

  const responseText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  let parsed: Partial<AIAnalysis>;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${responseText.slice(0, 200)}`);
  }

  // Validate and normalise
  const category: Category = VALID_CATEGORIES.includes(parsed.category as Category)
    ? (parsed.category as Category)
    : 'other';

  const importanceScore = Math.min(10, Math.max(1, Math.round(parsed.importanceScore ?? 5)));

  return {
    summary: parsed.summary ?? '',
    keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways.slice(0, 5) : [],
    category,
    importanceScore,
    importanceReason: parsed.importanceReason ?? '',
    isBreakthrough: Boolean(parsed.isBreakthrough),
    relatedTopics: Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics.slice(0, 5) : [],
  };
}

/**
 * Use Sonnet for high-stakes analysis (breakthrough articles, daily briefing synthesis).
 */
export async function synthesizeBriefing(
  articles: Array<{ title: string; summary: string; importanceScore: number; category: string }>,
  date: string
): Promise<{ executiveSummary: string; keyTrends: Array<{ title: string; description: string }> }> {
  const articleList = articles
    .slice(0, 30)
    .map((a, i) => `${i + 1}. [${a.category.toUpperCase()}] (${a.importanceScore}/10) ${a.title}\n   ${a.summary}`)
    .join('\n\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an AI industry analyst writing the daily briefing for ${date}.

Here are today's top AI articles:

${articleList}

Return JSON:
{
  "executiveSummary": "200-word executive summary of today's most important AI developments",
  "keyTrends": [
    { "title": "trend name", "description": "1-2 sentence description" }
  ]
}

Include 3-5 key trends. Identify genuine signals, not hype.`,
      },
    ],
  });

  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  try {
    return JSON.parse(text);
  } catch {
    return {
      executiveSummary: text.slice(0, 500),
      keyTrends: [],
    };
  }
}
