-- ============================================================
-- Migration: form questions + booking answers
-- Run this in Supabase SQL Editor
-- ============================================================

-- Form questions attached to a booking link
create table if not exists booking_questions (
  id           uuid primary key default uuid_generate_v4(),
  booking_link_id uuid not null references booking_links(id) on delete cascade,
  label        text not null,           -- e.g. "What's your company size?"
  type         text not null check (type in ('text', 'multiple_choice')),
  options      text[],                  -- only for multiple_choice
  required     boolean default false,
  position     int default 0,           -- display order
  created_at   timestamptz default now()
);

-- Answers submitted by a booker
create table if not exists booking_answers (
  id           uuid primary key default uuid_generate_v4(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  question_id  uuid not null references booking_questions(id) on delete cascade,
  answer       text,
  created_at   timestamptz default now()
);

create index if not exists on booking_questions(booking_link_id);
create index if not exists on booking_answers(booking_id);

-- RLS
alter table booking_questions enable row level security;
alter table booking_answers enable row level security;

create policy "questions_public_read" on booking_questions
  for select using (true);

create policy "questions_write" on booking_questions
  for all using (true);

create policy "answers_read" on booking_answers
  for select using (true);

create policy "answers_insert" on booking_answers
  for insert with check (true);
