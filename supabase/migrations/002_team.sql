-- Add an existing ClimateBooks user to an organisation by email (owner/admin only).
create or replace function public.add_member_by_email(org uuid, member_email text, member_role text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not has_role(org, array['owner','admin']) then return 'You do not have permission to manage this team.'; end if;
  if member_role not in ('admin','editor','viewer') then return 'Invalid role.'; end if;
  select id into uid from profiles where lower(email) = lower(trim(member_email));
  if uid is null then return 'No ClimateBooks account exists for that email. Ask them to sign up first.'; end if;
  insert into organisation_members (organisation_id, user_id, role) values (org, uid, member_role)
    on conflict (organisation_id, user_id) do update set role = excluded.role
    where organisation_members.role <> 'owner';
  insert into notifications (organisation_id, user_id, title, body)
    values (org, uid, 'You were added to an organisation', 'You now have ' || member_role || ' access.');
  return 'ok';
end $$;
revoke all on function public.add_member_by_email(uuid, text, text) from public, anon;
grant execute on function public.add_member_by_email(uuid, text, text) to authenticated;
