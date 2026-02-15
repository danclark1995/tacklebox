-- Guidance content table for editable guidance sections
CREATE TABLE IF NOT EXISTS guidance_sections (
  id TEXT PRIMARY KEY,
  section_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  updated_by TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Seed with default guidance content
INSERT OR IGNORE INTO guidance_sections (id, section_key, title, content, display_order) VALUES
  ('gs-001', 'prompt_social', 'Social Media', '[{"tip":"Specify the platform","example":"\"Create an Instagram carousel post\" is better than \"Create a social media post\""},{"tip":"Include the goal","example":"\"Drive traffic to our new product launch page\" gives the AI clear intent"},{"tip":"Reference the brand voice","example":"\"Use a playful, conversational tone consistent with the brand profile\" keeps output on-brand"},{"tip":"Mention format constraints","example":"\"Keep caption under 150 characters with 3-5 relevant hashtags\""},{"tip":"Provide context on the audience","example":"\"Target: small business owners aged 25-40 who value sustainability\""}]', 1),
  ('gs-002', 'prompt_documents', 'Documents', '[{"tip":"Define the document type clearly","example":"\"Write a one-page executive summary\" vs \"Write a document\""},{"tip":"Specify the reading level","example":"\"Write for a general audience with no technical jargon\""},{"tip":"Include structural requirements","example":"\"Use headers, bullet points, and a call-to-action at the end\""},{"tip":"State the key message upfront","example":"\"The main takeaway should be that our Q3 results exceeded projections by 15%\""}]', 2),
  ('gs-003', 'prompt_presentations', 'Presentations', '[{"tip":"Define the slide count and flow","example":"\"Create a 10-slide pitch deck: problem, solution, market, traction, team, ask\""},{"tip":"Specify text density","example":"\"Keep each slide to 3-4 bullet points maximum, 6-8 words each\""},{"tip":"Include speaker notes guidance","example":"\"Add speaker notes with talking points for each slide\""},{"tip":"Reference visual style","example":"\"Minimalist design, use brand colours, one image per slide maximum\""}]', 3),
  ('gs-004', 'prompt_ads', 'Ad Creatives', '[{"tip":"State the ad placement","example":"\"Facebook feed ad, 1080x1080\" is more useful than \"Create an ad\""},{"tip":"Include the value proposition","example":"\"Highlight our 30-day free trial and no credit card required\""},{"tip":"Define the CTA","example":"\"CTA button: Start Free Trial\" removes ambiguity"},{"tip":"Mention compliance needs","example":"\"Must include disclaimer text and comply with financial advertising rules\""},{"tip":"A/B testing variations","example":"\"Create two headline variations: one benefit-focused, one urgency-focused\""}]', 4),
  ('gs-005', 'brand_checklist', 'Brand Voice Guidelines', '["Brand story and origin narrative","Brand archetypes (personality framework)","Core messaging pillars","Tone of voice guidelines","Visual identity guidelines","Target audience profiles","Competitor differentiation points"]', 5),
  ('gs-006', 'quality_checklist', 'Quality Standards', '["Content aligns with the brand voice and tone","Key messaging pillars are represented","No factual errors or hallucinated claims","Appropriate length and format for the platform","Call-to-action is clear and compelling","Grammar and spelling are correct","Visual elements match brand guidelines","Content is original and not generic filler"]', 6);
