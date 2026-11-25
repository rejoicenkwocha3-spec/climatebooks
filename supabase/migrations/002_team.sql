-- Add an existing ClimateBooks user to an organisation by email (owner/admin only).
create or replace function public.cbk_add_member_by_email(org uuid, member_email text, member_role text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not cbk_has_role(org, array['owner','admin']) then return 'You do not have permission to manage this team.'; end if;
  if member_role not in ('admin','editor','viewer') then return 'Invalid role.'; end if;
  select id into uid from cbk_profiles where lower(email) = lower(trim(member_email));
  if uid is null then return 'No ClimateBooks account exists for that email. Ask them to sign up first.'; end if;
  insert into cbk_organisation_members (organisation_id, user_id, role) values (org, uid, member_role)
    on conflict (organisation_id, user_id) do update set role = excluded.role
    where cbk_organisation_members.role <> 'owner';
  insert into cbk_notifications (organisation_id, user_id, title, body)
    values (org, uid, 'You were added to an organisation', 'You now have ' || member_role || ' access.');
  return 'ok';
end $$;
revoke all on function public.cbk_add_member_by_email(uuid, text, text) from public, anon;
grant execute on function public.cbk_add_member_by_email(uuid, text, text) to authenticated;

-- ───────── Grants (idempotent; row level security still decides row access) ─────────
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on
  public.cbk_profiles, public.cbk_organisations, public.cbk_organisation_members,
  public.cbk_locations, public.cbk_departments, public.cbk_reporting_periods,
  public.cbk_emission_factors, public.cbk_suppliers, public.cbk_supplier_submissions,
  public.cbk_activity_records, public.cbk_emissions_calculations,
  public.cbk_climate_targets, public.cbk_reduction_initiatives,
  public.cbk_reports, public.cbk_documents, public.cbk_notifications
  to authenticated;
grant select on public.cbk_subscriptions, public.cbk_audit_logs to authenticated;
grant select on public.cbk_scope1_records, public.cbk_scope2_records, public.cbk_scope3_records to authenticated;
grant all on public.cbk_profiles, public.cbk_organisations, public.cbk_organisation_members,
  public.cbk_subscriptions, public.cbk_audit_logs to service_role;
grant usage, select on all sequences in schema public to service_role;
