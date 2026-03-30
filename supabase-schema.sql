-- Boxing analyses table
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  video_url TEXT NOT NULL,
  video_name TEXT NOT NULL,
  status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'analyzing', 'commenting', 'completed', 'error')),
  rounds JSONB DEFAULT '[]'::jsonb,
  overall_summary TEXT,
  commentary TEXT,
  red_corner_name TEXT DEFAULT 'Red Corner',
  blue_corner_name TEXT DEFAULT 'Blue Corner'
);

-- User evaluations (user scores per round)
CREATE TABLE evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  round INTEGER NOT NULL,
  red_corner_score INTEGER NOT NULL CHECK (red_corner_score BETWEEN 1 AND 10),
  blue_corner_score INTEGER NOT NULL CHECK (blue_corner_score BETWEEN 1 AND 10),
  comment TEXT
);

-- Knowledge base
CREATE TABLE knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general' CHECK (category IN ('technique', 'strategy', 'rule', 'observation', 'general'))
);

-- Storage bucket for videos
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- Allow public uploads to videos bucket
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos');
CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT USING (bucket_id = 'videos');

-- Enable RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth for demo)
CREATE POLICY "Allow all on analyses" ON analyses FOR ALL USING (true);
CREATE POLICY "Allow all on evaluations" ON evaluations FOR ALL USING (true);
CREATE POLICY "Allow all on knowledge" ON knowledge FOR ALL USING (true);
