import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, Palette, CheckCircle } from 'lucide-react'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import { colours, spacing, typography } from '@/config/tokens'

const PROMPT_SECTIONS = [
  {
    title: 'Social Media',
    tips: [
      { tip: 'Specify the platform', example: '"Create an Instagram carousel post" is better than "Create a social media post"' },
      { tip: 'Include the goal', example: '"Drive traffic to our new product launch page" gives the AI clear intent' },
      { tip: 'Reference the brand voice', example: '"Use a playful, conversational tone consistent with the brand profile" keeps output on-brand' },
      { tip: 'Mention format constraints', example: '"Keep caption under 150 characters with 3-5 relevant hashtags"' },
      { tip: 'Provide context on the audience', example: '"Target: small business owners aged 25-40 who value sustainability"' },
    ],
  },
  {
    title: 'Documents',
    tips: [
      { tip: 'Define the document type clearly', example: '"Write a one-page executive summary" vs "Write a document"' },
      { tip: 'Specify the reading level', example: '"Write for a general audience with no technical jargon"' },
      { tip: 'Include structural requirements', example: '"Use headers, bullet points, and a call-to-action at the end"' },
      { tip: 'State the key message upfront', example: '"The main takeaway should be that our Q3 results exceeded projections by 15%"' },
    ],
  },
  {
    title: 'Presentations',
    tips: [
      { tip: 'Define the slide count and flow', example: '"Create a 10-slide pitch deck: problem, solution, market, traction, team, ask"' },
      { tip: 'Specify text density', example: '"Keep each slide to 3-4 bullet points maximum, 6-8 words each"' },
      { tip: 'Include speaker notes guidance', example: '"Add speaker notes with talking points for each slide"' },
      { tip: 'Reference visual style', example: '"Minimalist design, use brand colours, one image per slide maximum"' },
    ],
  },
  {
    title: 'Ad Creatives',
    tips: [
      { tip: 'State the ad placement', example: '"Facebook feed ad, 1080x1080" is more useful than "Create an ad"' },
      { tip: 'Include the value proposition', example: '"Highlight our 30-day free trial and no credit card required"' },
      { tip: 'Define the CTA', example: '"CTA button: Start Free Trial" removes ambiguity' },
      { tip: 'Mention compliance needs', example: '"Must include disclaimer text and comply with financial advertising rules"' },
      { tip: 'A/B testing variations', example: '"Create two headline variations: one benefit-focused, one urgency-focused"' },
    ],
  },
]

const BRAND_CHECKLIST = [
  'Brand story and origin narrative',
  'Brand archetypes (personality framework)',
  'Core messaging pillars',
  'Tone of voice guidelines',
  'Visual identity guidelines',
  'Target audience profiles',
  'Competitor differentiation points',
]

const QUALITY_CHECKLIST = [
  'Content aligns with the brand voice and tone',
  'Key messaging pillars are represented',
  'No factual errors or hallucinated claims',
  'Appropriate length and format for the platform',
  'Call-to-action is clear and compelling',
  'Grammar and spelling are correct',
  'Visual elements match brand guidelines',
  'Content is original and not generic filler',
]

export default function AdminGuidance() {
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{ padding: `${spacing[6]} 0` }}>
      <h1 style={pageTitleStyle}>AI & Content Guidance</h1>

      {/* Section 1: Prompt Best Practices */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>
          <BookOpen size={18} />
          Prompt Best Practices
        </h2>
        <GlowCard style={{ padding: spacing[5] }}>
          <p style={introTextStyle}>
            Well-crafted prompts produce better AI output. Expand each content type below for specific tips and examples.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {PROMPT_SECTIONS.map((section) => {
              const isOpen = expandedSections[section.title]
              return (
                <div key={section.title} style={accordionItemStyle}>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSection(section.title)}
                    style={accordionButtonStyle}
                  >
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontWeight: 600 }}>{section.title}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </Button>

                  {isOpen && (
                    <div style={accordionContentStyle}>
                      {section.tips.map((item, i) => (
                        <div key={i} style={tipStyle}>
                          <div style={tipTitleStyle}>{item.tip}</div>
                          <div style={tipExampleStyle}>{item.example}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </GlowCard>
      </div>

      {/* Section 2: Brand Voice Guidelines */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>
          <Palette size={18} />
          Brand Voice Guidelines
        </h2>
        <GlowCard style={{ padding: spacing[5] }}>
          <p style={introTextStyle}>
            The AI uses brand profiles to tailor generated content. The more detail in the brand profile, the better the AI output.
          </p>

          <p style={bodyTextStyle}>
            When generating content, the AI references the client's brand profile to match their voice, values, and visual identity.
            A comprehensive brand profile leads to content that feels authentic and on-brand from the first draft.
          </p>

          <div style={subHeadingStyle}>Brand Profile Checklist</div>
          <p style={bodyTextStyle}>
            Ensure each brand profile includes these elements for optimal AI output:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {BRAND_CHECKLIST.map((item, i) => (
              <div key={i} style={checklistItemStyle}>
                <CheckCircle size={14} color={colours.neutral[500]} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Section 3: Quality Standards */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>
          <CheckCircle size={18} />
          Quality Standards
        </h2>
        <GlowCard style={{ padding: spacing[5] }}>
          <p style={introTextStyle}>
            Use this checklist before approving any AI-generated content. Quality control ensures the final output meets professional standards.
          </p>

          <div style={subHeadingStyle}>Review Checklist</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginBottom: spacing[5] }}>
            {QUALITY_CHECKLIST.map((item, i) => (
              <div key={i} style={checklistItemStyle}>
                <CheckCircle size={14} color={colours.neutral[500]} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div style={subHeadingStyle}>When to Regenerate vs Edit</div>
          <div style={{ display: 'flex', gap: spacing[4] }}>
            <div style={{ flex: 1 }}>
              <div style={miniHeadingStyle}>Regenerate when:</div>
              <ul style={listStyle}>
                <li>The tone is completely off-brand</li>
                <li>The structure doesn't match the format</li>
                <li>The content misses the core message</li>
                <li>Multiple factual errors are present</li>
              </ul>
            </div>
            <div style={{ flex: 1 }}>
              <div style={miniHeadingStyle}>Edit manually when:</div>
              <ul style={listStyle}>
                <li>Minor wording adjustments needed</li>
                <li>Small factual corrections required</li>
                <li>A specific phrase needs brand language</li>
                <li>Length needs slight trimming</li>
              </ul>
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  )
}

const pageTitleStyle = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: '#ffffff',
  marginBottom: spacing[6],
  marginTop: 0,
}

const sectionStyle = {
  marginBottom: spacing[8],
}

const sectionTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: '#ffffff',
  marginBottom: spacing[4],
  marginTop: 0,
}

const introTextStyle = {
  fontSize: typography.fontSize.sm,
  color: colours.neutral[400],
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: spacing[4],
}

const bodyTextStyle = {
  fontSize: typography.fontSize.sm,
  color: colours.neutral[500],
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: spacing[4],
}

const subHeadingStyle = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: '#ffffff',
  marginBottom: spacing[3],
}

const miniHeadingStyle = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[300],
  marginBottom: spacing[2],
}

const accordionItemStyle = {
  borderBottom: '1px solid #1a1a1a',
}

const accordionButtonStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  padding: `${spacing[3]} 0`,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#ffffff',
  fontSize: typography.fontSize.sm,
  fontFamily: typography.fontFamily.sans,
}

const accordionContentStyle = {
  paddingBottom: spacing[4],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
}

const tipStyle = {
  paddingLeft: spacing[3],
  borderLeft: '2px solid #333',
}

const tipTitleStyle = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: '#ffffff',
  marginBottom: '4px',
}

const tipExampleStyle = {
  fontSize: '12px',
  color: colours.neutral[500],
  fontStyle: 'italic',
  lineHeight: 1.5,
}

const checklistItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[2],
  fontSize: typography.fontSize.sm,
  color: colours.neutral[400],
  lineHeight: 1.5,
}

const listStyle = {
  margin: 0,
  paddingLeft: spacing[4],
  fontSize: typography.fontSize.sm,
  color: colours.neutral[500],
  lineHeight: 1.8,
}
