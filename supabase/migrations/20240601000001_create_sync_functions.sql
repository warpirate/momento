-- Function to pull changes
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
      extract(epoch from updated_at) * 1000 as updated_at
    from public.entries
    where updated_at > _ts
    and user_id = auth.uid()
  ) t;

  -- Pull signals
  select jsonb_agg(t) into _signals
  from (
    select
      id,
      entry_id,
      mood,
      activities,
      people,
      sentiment_score,
      tags,
      extract(epoch from created_at) * 1000 as created_at
    from public.entry_signals
    where created_at > _ts
    and exists (select 1 from public.entries where id = entry_signals.entry_id and user_id = auth.uid())
  ) t;

  return jsonb_build_object(
    'changes', jsonb_build_object(
      'entries', coalesce(_entries, '[]'::jsonb),
      'entry_signals', coalesce(_signals, '[]'::jsonb)
    ),
    'timestamp', extract(epoch from now()) * 1000
  );
end;
$$ language plpgsql security definer;

-- Function to push changes
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
      );
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

  -- Note: Deletions are tricky with WatermelonDB sync if not using soft deletes.
  -- For now, we'll skip deletions or assume soft deletes are implemented later.
  
  -- Process signals (usually created by AI, but maybe updated by user?)
  -- We'll allow creation for now if we want to support offline AI simulation or manual tagging
  if (changes->'entry_signals'->>'created') is not null then
    for _signal in select * from jsonb_array_elements(changes->'entry_signals'->'created') loop
      insert into public.entry_signals (id, entry_id, mood, activities, people, sentiment_score, tags, created_at)
      values (
        (_signal->>'id')::uuid,
        (_signal->>'entry_id')::uuid,
        _signal->>'mood',
        (select array_agg(x) from jsonb_array_elements_text(_signal->'activities') t(x)),
        (select array_agg(x) from jsonb_array_elements_text(_signal->'people') t(x)),
        (_signal->>'sentiment_score')::float,
        (select array_agg(x) from jsonb_array_elements_text(_signal->'tags') t(x)),
        to_timestamp((_signal->>'created_at')::bigint / 1000)
      );
    end loop;
  end if;

end;
$$ language plpgsql security definer;