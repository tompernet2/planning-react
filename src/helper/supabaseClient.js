import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://blhmrhfozjsstnuiddtb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaG1yaGZvempzc3RudWlkZHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjA2NTAsImV4cCI6MjA3NjUzNjY1MH0.P4h4SPARhJ5ooOI_TkF_7nWGgqDwrzYj04GXg-xtql4";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;