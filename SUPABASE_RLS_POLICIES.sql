-- SUPABASE RLS POLICIES FIX
-- Enable Row Level Security and create permissive policies for development

-- Enable RLS on all tables
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.murals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_streams ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development (allow all operations)
-- ASSETS
CREATE POLICY "Allow all operations on assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);

-- CAMPAIGNS
CREATE POLICY "Allow all operations on campaigns" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);

-- STREAM SESSIONS
CREATE POLICY "Allow all operations on stream_sessions" ON public.stream_sessions FOR ALL USING (true) WITH CHECK (true);

-- PLACEMENTS
CREATE POLICY "Allow all operations on placements" ON public.placements FOR ALL USING (true) WITH CHECK (true);

-- MURALS
CREATE POLICY "Allow all operations on murals" ON public.murals FOR ALL USING (true) WITH CHECK (true);

-- CARDS
CREATE POLICY "Allow all operations on cards" ON public.cards FOR ALL USING (true) WITH CHECK (true);

-- MURAL CARDS
CREATE POLICY "Allow all operations on mural_cards" ON public.mural_cards FOR ALL USING (true) WITH CHECK (true);

-- DECKS
CREATE POLICY "Allow all operations on decks" ON public.decks FOR ALL USING (true) WITH CHECK (true);

-- DECK ASSETS
CREATE POLICY "Allow all operations on deck_assets" ON public.deck_assets FOR ALL USING (true) WITH CHECK (true);

-- USERS
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- PROCESSING JOBS
CREATE POLICY "Allow all operations on processing_jobs" ON public.processing_jobs FOR ALL USING (true) WITH CHECK (true);

-- ASSET STREAMS
CREATE POLICY "Allow all operations on asset_streams" ON public.asset_streams FOR ALL USING (true) WITH CHECK (true);