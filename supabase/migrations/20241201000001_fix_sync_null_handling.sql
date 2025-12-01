-- Fix sync functions to handle null/undefined values properly
-- This migration updates the sync functions to prevent TypeError when accessing undefined properties

-- Drop and recreate pull_changes function with proper null handling
create or replace function public.pull_changes(last_pulled_at bigint, schema_version int)
returns jsonb as $$
declare
  _ts timestamp with time zone;
  _entries jsonb;
  _signals jsonb;
begin
  _ts := to_timestamp(last_pulled_at / 1000);

  -- Pull entries
  select jsonb_agg(t) into _entries
  from (
    select
      id,
      content,
      user_id,
      extract(epoch from created_at) * 1000 as created_at,
      cast(extract(epoch from updated_at) * 1000 as bigint) as updated_at
    from public.entries
    where updated_at > _ts
    and user_id = auth.uid()
  ) t;

  -- Pull signals with proper null handling for array fields
  select jsonb_agg(t) into _signals
  from (
    select
      id,
      entry_id,
      coalesce(mood, '') as mood,
      coalesce(activities, '[]'::jsonb) as activities,
      coalesce(people, '[]'::jsonb) as people,
      sentiment_score, -- Keep null as is for numbers
      coalesce(tags, array[]::text[]) as tags,
      cast(extract(epoch from created_at) * 1000 as bigint) as created_at
    from public.entry_signals
    where created_at > _ts
    and exists (select 1 from public.entries where id = entry_signals.entry_id and user_id = auth.uid())
  ) t;

  return jsonb_build_object(
    'changes', jsonb_build_object(
      'entries', jsonb_build_object(
        'created', coalesce(_entries, '[]'::jsonb),
        'updated', '[]'::jsonb,
        'deleted', '[]'::jsonb
      ),
      'entry_signals', jsonb_build_object(
        'created', coalesce(_signals, '[]'::jsonb),
        'updated', '[]'::jsonb,
        'deleted', '[]'::jsonb
      )
    ),
    'timestamp', cast(extract(epoch from now()) * 1000 as bigint)
  );
end;
$$ language plpgsql security definer;

-- Drop and recreate push_changes function with proper null handling
create or replace function public.push_changes(changes jsonb, last_pulled_at bigint)
returns void as $$
declare
  _entry jsonb;
  _signal jsonb;
begin
  -- Process entries
  if (changes->'entries'->>'created') is not null then
    for _entry in select * from jsonb_array_elements(changes->'entries'->'created') loop
      insert into public.entries (id, content, user_id, created_at, updated_at)
      values (
        (_entry->>'id')::uuid,
        _entry->>'content',
        auth.uid(),
        to_timestamp((_entry->>'created_at')::bigint / 1000),
        to_timestamp((_entry->>'updated_at')::bigint / 1000)
      )
      on conflict (id) do update set
        content = excluded.content,
        updated_at = excluded.updated_at;
    end loop;
  end if;

  if (changes->'entries'->>'updated') is not null then
    for _entry in select * from jsonb_array_elements(changes->'entries'->'updated') loop
      update public.entries
      set
        content = _entry->>'content',
        updated_at = to_timestamp((_entry->>'updated_at')::bigint / 1000)
      where id = (_entry->>'id')::uuid and user_id = auth.uid();
    end loop;
  end if;

  -- Process signals with proper null handling
  if (changes->'entry_signals'->>'created') is not null then
    for _signal in select * from jsonb_array_elements(changes->'entry_signals'->'created') loop
      insert into public.entry_signals (id, entry_id, mood, activities, people, sentiment_score, tags, created_at)
      values (
        (_signal->>'id')::uuid,
        (_signal->>'entry_id')::uuid,
        case when (_signal->>'mood') is null or (_signal->>'mood') = '' then null else _signal->>'mood' end,
        coalesce(_signal->'activities', '[]'::jsonb),
        coalesce(_signal->'people', '[]'::jsonb),
        case when (_signal->>'sentiment_score') is null or (_signal->>'sentiment_score') = '' then null 
             else (_signal->>'sentiment_score')::float end,
        case when (_signal->'tags') is null or jsonb_typeof(_signal->'tags') = 'null' then '[]'::text[] 
             else (select array_agg(x) from jsonb_array_elements_text(_signal->'tags') t(x)) end,
        to_timestamp((_signal->>'created_at')::bigint / 1000)
      );
    end loop;
  end if;

end;
$$ language plpgsql security definer;
