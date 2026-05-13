// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

// Ganti nilai di bawah ini dengan data dari Project Settings > API Supabase Bos
const supabaseUrl = 'https://qsizuivohreeilqzhcef.supabase.co';
const supabaseKey = 'sb_publishable_Fii896jSXttOD57g6yh0Rw_-BJA2bZT';

export const supabase = createClient(supabaseUrl, supabaseKey);