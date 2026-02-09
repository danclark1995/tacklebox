-- Seed R Studios brand profile into production
-- Updates client@tacklebox.app user and creates full brand profile

-- Update client user to R Studios
UPDATE users SET
  display_name = 'Connie McInnes',
  company = 'R Studios'
WHERE id = 'user_client_01';

-- Update demo project name
UPDATE projects SET
  name = 'R Studios Brand Refresh',
  description = 'Complete brand identity unification for R Studios boutique fitness locations.'
WHERE id = 'proj_demo_01';

-- Upsert brand profile
INSERT INTO brand_profiles (id, client_id, industry, tagline, mission_statement, target_audience, strategic_tasks, founder_story, brand_narrative, metaphors, brand_values, archetypes, messaging_pillars, colours_primary, colours_secondary, typography, imagery_guidelines, voice_tone, dos, donts, brand_guide_path)
VALUES (
  'bp_rstudios_01',
  'user_client_01',
  'Boutique Fitness',
  'The Future of Fitness is Human',
  'Rstudios is preparing to take the next step in its evolution and is looking to align each location under a cohesive, unified brand identity that reflects the spirit of the entire Rstudios community.',
  'Fitness enthusiasts seeking inclusive, judgment-free boutique fitness experiences. All beings, all bodies — people who want to feel free in their own form without shrinking, conforming, or proving themselves.',
  'Through refreshed brand tools, a compelling metaphorical narrative, and thoughtfully enhanced visual elements, we will activate the full potential of Rstudios. This process will invite more people into the community, deepen existing connections, and ignite a shared energy that motivates every individual to shine brighter within the collective.',
  'For too long, fitness has chased perfection. Mirrors and metrics, ego without empathy. We''re done with that. Rstudios is a movement for movement. We believe it should feel joyful, not judgmental, and that resilience is mental as much as physical. We create safe spaces where people feel free in their own form, without shrinking, conforming, or proving themselves. We offer variety because people deserve freedom. We build intentionally in underserved communities. We celebrate every kind of body, background, and breakthrough. Because everyone deserves a sense of home. Rstudios is boutique fitness reimagined. We train instructors to lead with heart, not ego. This isn''t about workouts, it''s about changing what fitness feels like. When you create a space where everyone belongs, everything changes. This is the movement. This is R Studios. — Connie McInnes, Founder',
  'We exist on the belief that resilience lives in what we build. Each challenge, each setback, each scar becomes gold in the making. Every studio is a safe space through the inevitable storms of life. Each location is unique, yet moves in a shared rhythm. Together, we grow through authenticity, connection and passion. Here we train to look within, to empower the spirit, and to evolve. Because the future of fitness is human. Welcoming all beings, all bodies, and every journey.',
  '[{"name":"The Storm","description":"At Rstudios, we know storms are inevitable. What defines us isn''t the weather, but the ground we choose to stand on. When you build your life with intention, showing up as your full self and moving with conviction, no storm can shake your foundation. Every breath and drop of sweat becomes part of the form you are shaping. One that is steady, adaptable, and fully alive. A structure built without connection will crumble, but one built in unity endures. At Rstudios, we find balance together; each of us a beam, a rhythm, a presence within the whole. The storm doesn''t define us, the foundation does, and here, the foundation is rock."},{"name":"Kintsugi","description":"At Rstudios, we know that time, pressure, and life can test us. Yet it''s in the mending that we rediscover our wholeness. When you face what''s cracked and rebuild with purpose, no fracture can limit your spirit. What once felt fragile becomes sealed in gold; your story bound in resilience and form. A single vessel may bend under pressure, but joined with others, its resilience expands. We mend side by side, creating something deeper and more connected. Not flawless, but forged through care, courage, and presence. It''s not the break that defines us. It''s the courage to evolve."}]',
  '[{"name":"Authenticity","tagline":"Come As You Are","narrative":"At Rstudios, every journey begins with presence. There are no mirrors. Only space to look within. We build on intention, not illusion. We show up with our cracks, our stories, and our courage to evolve. We trust that resilience is found in honesty, not perfection. What once was broken becomes our golden lining. Because fitness is human."},{"name":"Connection","tagline":"Join The Movement","narrative":"The rain begins softly. Under the same sky, we move from solitude into shared rhythm, each breath aligning us closer together. Lightning reveals familiar faces: all beings, all bodies, drawn toward something greater than ourselves. In that light, we remember that connection is the foundation that holds us."},{"name":"Teamwork","tagline":"Our Foundation","narrative":"Where a house becomes a home. Each beam supports the next; each voice rises with encouragement through the wind. We rise and fall together, anchored in a community that believes resilience is built in teamwork. A shared commitment that keeps us balanced, adaptable, and present. Our home stands because we choose to hold one another up."},{"name":"Passion","tagline":"Gold In The Making","narrative":"And when the clouds break, light returns. It finds us evolved, not unbroken, but unstoppable. A shared energy ignites within us, turning cracks into gold and motion into meaning. Our community moves under one mission, each of us living proof that fitness is human, where all beings and all bodies belong."}]',
  '[{"name":"The Everyman","description":"The Everyman finds energy in belonging. They show up not to stand out, but to stand with. Their courage lives in honesty, arriving as they are, open and committed. They remind the community that we are unstoppable together, that fitness is not about appearance, but about empathy, connection, and shared rhythm."},{"name":"The Outlaw","description":"The Outlaw challenges the illusion of perfection. They unbox what''s real, tearing down the mirror, breaking the mold, and wearing their scars with gratitude. Through bold defiance, they give others permission to be genuine: to sweat, to fall, to rebuild without shame. Their spark cuts through the storm, reminding us that authenticity is its own kind of freedom."},{"name":"The Magician","description":"The Magician finds opportunity in what''s been cracked open. They know resilience is shaped in repair, and that light only shines in the dark. They turn pain into purpose and motion into transformation. Their presence invites others to see beyond the storm and to believe that what tests us can also help us evolve."}]',
  '[{"pillar_name":"The Future of Fitness is Human","phrases":["The future of fitness is human.","Because fitness is human.","Fitness is human.","Revolutionizing why you move.","Revolutionizing the way you move.","Revolutionizing the way people move.","A movement for movement.","Boutique fitness reimagined."]},{"pillar_name":"All Beings, All Bodies","phrases":["All beings, all bodies.","No mirrors, no judgements.","When everyone belongs, everything changes.","Lead with heart, not ego.","Changing what fitness feels like.","We train to look within.","Empower your spirit.","Evolve with every challenge."]}]',
  '[{"name":"Primary Black","hex":"#000000","pantone":""},{"name":"Pantone 4505 C","hex":"#998542","pantone":"4505 C"},{"name":"Black","hex":"#000000","pantone":""},{"name":"Cool Gray 1 C","hex":"#d9d9d6","pantone":"Cool Gray 1 C"}]',
  '[{"name":"Pantone 4515 C","hex":"#b3a369","pantone":"4515 C"},{"name":"Neutral Black C","hex":"#222223","pantone":"Neutral Black C"},{"name":"White","hex":"#ffffff","pantone":""}]',
  '[{"role":"Title","font_family":"Eurostile","weight":"Black","tracking":"0","case_rule":"All caps"},{"role":"Subtitle","font_family":"Eurostile Ext","weight":"Black","tracking":"120","case_rule":"All caps"},{"role":"Body","font_family":"Eurostile","weight":"Medium","tracking":"0","case_rule":"Proper case"}]',
  '{"backgrounds":["Light — cream/warm grey with gold kintsugi crack textures","Dark — black with gold kintsugi crack textures and lightning","Alternate — dark stormy atmosphere with lightning and warm golden tones"],"notes":"Lightning and kintsugi (gold crack repair) are the two core visual motifs. Imagery should feel powerful, resilient, and warm. Photography features diverse people in fitness contexts. Gold accents throughout.","template_descriptions":["Social posts use dark backgrounds with gold accents and brand messaging","Announcement templates feature circular logo badge with surrounding tagline text","Location-specific branding uses R + location name format (R Rival, R Rio, R Rinse, etc.)"]}',
  'Empowering, inclusive, poetic but grounded. Speaks with warmth and conviction. Uses metaphorical language (storms, gold, building) naturally. Never preachy or exclusive. Celebrates imperfection and resilience. First person plural (we/us/our) to reinforce community.',
  'Use gold (#998542 or #b3a369) as the signature accent colour. Maintain dark/black backgrounds as the primary canvas. Feature diverse body types and fitness levels in all imagery. Use lightning and kintsugi motifs consistently. Reference brand values (Authenticity, Connection, Teamwork, Passion) in messaging. Use Eurostile font family. Include tagline ''All Beings, All Bodies | The Future of Fitness is Human'' on materials.',
  'Never use mirrors or mirror imagery. Avoid language about perfection, ideal bodies, or comparison. Don''t use bright/neon fitness aesthetics. Avoid stock-photo-style posed fitness imagery. Never use language that excludes or judges. Don''t deviate from the Eurostile font family for branded materials. Avoid cluttered layouts — keep it bold and minimal.',
  'brand-guides/r-studios/brand-guide.pdf'
)
ON CONFLICT(client_id) DO UPDATE SET
  industry = excluded.industry,
  tagline = excluded.tagline,
  mission_statement = excluded.mission_statement,
  target_audience = excluded.target_audience,
  strategic_tasks = excluded.strategic_tasks,
  founder_story = excluded.founder_story,
  brand_narrative = excluded.brand_narrative,
  metaphors = excluded.metaphors,
  brand_values = excluded.brand_values,
  archetypes = excluded.archetypes,
  messaging_pillars = excluded.messaging_pillars,
  colours_primary = excluded.colours_primary,
  colours_secondary = excluded.colours_secondary,
  typography = excluded.typography,
  imagery_guidelines = excluded.imagery_guidelines,
  voice_tone = excluded.voice_tone,
  dos = excluded.dos,
  donts = excluded.donts,
  brand_guide_path = excluded.brand_guide_path,
  updated_at = datetime('now');
