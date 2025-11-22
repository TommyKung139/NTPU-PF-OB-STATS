-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PLAYERS TABLE
create table players (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  number text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- GAMES TABLE
create table games (
  id uuid default uuid_generate_v4() primary key,
  opponent text not null,
  date date not null,
  is_finished boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STATS TABLE
create table stats (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references players(id) on delete cascade not null,
  game_id uuid references games(id) on delete cascade not null,
  pa integer default 0,
  ab integer default 0,
  h1 integer default 0,
  h2 integer default 0,
  h3 integer default 0,
  hr integer default 0,
  rbi integer default 0,
  bb integer default 0,
  so integer default 0,
  sf integer default 0,
  e integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table players enable row level security;
alter table games enable row level security;
alter table stats enable row level security;

-- Create Policies (Allow public read/write for this demo app)
-- Note: In a real production app, you'd want authentication.
-- For now, we'll allow anyone with the anon key to do everything.

create policy "Public Access Players" on players for all using (true);
create policy "Public Access Games" on games for all using (true);
create policy "Public Access Stats" on stats for all using (true);
