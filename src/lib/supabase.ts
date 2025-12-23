import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qnfugnwytpmuwyodnpiz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZnVnbnd5dHBtdXd5b2RucGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjIyMzYsImV4cCI6MjA3NjkzODIzNn0.ZFP_8GeJIGUD_45v37wTRG68WQIKnD1pVtGaik2G1MM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
