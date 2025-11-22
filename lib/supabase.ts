import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eshqcnqrwtclfosogdjg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaHFjbnFyd3RjbGZvc29nZGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDU0ODksImV4cCI6MjA3OTM4MTQ4OX0.TPU4i5yxh4ac0ytQCggwwExQP3Ub4hP7Qj0KkpPT96E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
