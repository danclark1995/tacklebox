CREATE TABLE IF NOT EXISTS tool_links (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon_name TEXT DEFAULT 'link',
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO tool_links (id, name, description, url, icon_name, display_order) VALUES
('tool-1', 'Adobe Creative Suite', 'Design, photo, and video editing', 'https://www.adobe.com', 'pen-tool', 1),
('tool-2', 'Canva', 'Quick design and templates', 'https://www.canva.com', 'layout', 2),
('tool-3', 'Figma', 'UI/UX design and prototyping', 'https://www.figma.com', 'figma', 3),
('tool-4', 'Notion', 'Notes, docs, and project planning', 'https://www.notion.so', 'book-open', 4),
('tool-5', 'Google Drive', 'File storage and collaboration', 'https://drive.google.com', 'hard-drive', 5),
('tool-6', 'Slack', 'Team communication', 'https://www.slack.com', 'message-square', 6),
('tool-7', 'Loom', 'Screen recording and video messages', 'https://www.loom.com', 'video', 7),
('tool-8', 'Unsplash', 'Free stock photography', 'https://unsplash.com', 'image', 8),
('tool-9', 'Coolors', 'Colour palette generator', 'https://coolors.co', 'palette', 9),
('tool-10', 'Type Scale', 'Typography scale calculator', 'https://typescale.com', 'type', 10);
