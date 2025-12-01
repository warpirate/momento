-- Create entries table
create table if not exists public.entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on entries
alter table public.entries enable row level security;

-- Policies for entries
create policy "Users can create their own entries"
on public.entries for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their own entries"
on public.entries for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own entries"
on public.entries for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own entries"
on public.entries for delete
to authenticated
using (auth.uid() = user_id);

-- Create entry_signals table for AI insights
create table if not exists public.entry_signals (
  id uuid default gen_random_uuid() primary key,
  entry_id uuid references public.entries(id) on delete cascade not null,
  mood text,
  activities text[], -- Array of strings
  people text[],     -- Array of strings
  sentiment_score float,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on entry_signals
alter table public.entry_signals enable row level security;

-- Policies for entry_signals
-- Users can view signals for their own entries
create policy "Users can view signals for their own entries"
on public.entry_signals for select
to authenticated
using (
  exists (
    select 1 from public.entries
    where entries.id = entry_signals.entry_id
    and entries.user_id = auth.uid()
  )
);

-- Service role (Edge Functions) needs full access, but RLS is bypassed by service role key usually.
-- However, if we want to be explicit or if we insert from client (which we shouldn't for AI), we might need policies.
-- For now, we assume AI insertion happens via Edge Function with Service Role.

-- Create a function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at on entries
create trigger handle_entries_updated_at
before update on public.entries
for each row
execute procedure public.handle_updated_at();