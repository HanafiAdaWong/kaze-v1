import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://njmibithreklfiwuajsd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qbWliaXRocmVrbGZpd3VhanNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDE1MTMsImV4cCI6MjA4NjkxNzUxM30.QYOhqgk2VYm14mj7CMzoAWI0_IOhnLEsMDojInaXieU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
