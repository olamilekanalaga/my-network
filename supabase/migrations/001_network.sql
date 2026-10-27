-- Run in a fresh Supabase project via SQL Editor or supabase db push.
create extension if not exists pgcrypto;
create table public.people (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(trim(name))>0), email text not null default '',phone text not null default '',photo text not null default '',location text not null default '',position text not null default '',industry text not null default '',
 categories text[] not null default '{}',skills text[] not null default '{}',services text not null default '',building text not null default '',needs text not null default '',offers text not null default '',resources text not null default '',links text[] not null default '{}',met text not null default '',met_date text not null default '',notes text not null default '',transcript text not null default '',promises text not null default '',strength int not null default 3 check(strength between 1 and 5),source text not null default '',verification text not null default 'Inferred' check(verification in ('Confirmed','Publicly observed','Inferred')),updated_at timestamptz not null default now(),consent text not null default 'Private; sharing not approved',unique(owner_id,id)
);
create table public.organizations (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 kind text not null check(kind in ('Company','Community','Event')),name text not null,industry text not null default '',location text not null default '',description text not null default '',capabilities text not null default '',needs text not null default '',website text not null default '',event_date text not null default '',notes text not null default '',unique(owner_id,id)
);
create table public.affiliations (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,person_id uuid not null,organization_id uuid not null,role text not null default '',
 foreign key(owner_id,person_id) references public.people(owner_id,id) on delete cascade,foreign key(owner_id,organization_id) references public.organizations(owner_id,id) on delete cascade, unique(owner_id,person_id,organization_id)
);
create table public.relationships (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,from_id uuid not null,to_id uuid not null,label text not null,verification text not null check(verification in ('Confirmed','Publicly observed','Inferred')),source text not null default '',check(from_id<>to_id)
);
create table public.facts (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,person_id uuid not null,text text not null,source_url text not null default '',observed_at text not null default '',confidence numeric not null check(confidence between 0 and 1),status text not null default 'pending' check(status in ('pending','approved')),verification text not null check(verification in ('Confirmed','Publicly observed','Inferred')),visibility text not null default 'private' check(visibility in ('private','public','shareable')),
 foreign key(owner_id,person_id) references public.people(owner_id,id) on delete cascade
);
create table public.transactions (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,person_id uuid not null,description text not null,amount numeric not null check(amount>=0),currency text not null default 'GBP',date text not null default '',direction text not null check(direction in ('received','paid')),notes text not null default '',
 foreign key(owner_id,person_id) references public.people(owner_id,id) on delete cascade
);
create table public.opportunities (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,title text not null,status text not null default 'Discovered' check(status in ('Discovered','Researching','Introduction Requested','Introduced','Negotiating','Won','Lost','Paused')),
 person_ids uuid[] not null default '{}',organization_ids uuid[] not null default '{}',value numeric check(value>=0),potential_fee numeric check(potential_fee>=0),agreed_fee numeric check(agreed_fee>=0),follow_up text not null default '',notes text not null default '',outcome text not null default '',unique(owner_id,id)
);
create table public.opportunity_people(owner_id uuid not null,opportunity_id uuid not null,person_id uuid not null,primary key(opportunity_id,person_id),foreign key(owner_id,opportunity_id) references public.opportunities(owner_id,id) on delete cascade,foreign key(owner_id,person_id) references public.people(owner_id,id) on delete cascade);
create table public.opportunity_organizations(owner_id uuid not null,opportunity_id uuid not null,organization_id uuid not null,primary key(opportunity_id,organization_id),foreign key(owner_id,opportunity_id) references public.opportunities(owner_id,id) on delete cascade,foreign key(owner_id,organization_id) references public.organizations(owner_id,id) on delete cascade);
create table public.activities (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,person_id uuid,opportunity_id uuid,text text not null,date text not null default '',done boolean not null default false,
 foreign key(owner_id,person_id) references public.people(owner_id,id),foreign key(owner_id,opportunity_id) references public.opportunities(owner_id,id)
);
create function public.check_relationship_owner() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.people where owner_id=NEW.owner_id and id=NEW.from_id union all select 1 from public.organizations where owner_id=NEW.owner_id and id=NEW.from_id)
 or not exists(select 1 from public.people where owner_id=NEW.owner_id and id=NEW.to_id union all select 1 from public.organizations where owner_id=NEW.owner_id and id=NEW.to_id) then raise exception 'Relationship endpoints must belong to the current owner';end if;return NEW;
end $$;
create trigger relationship_owner before insert or update on public.relationships for each row execute function public.check_relationship_owner();
create function public.sync_opportunity_links() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 delete from public.opportunity_people where opportunity_id=NEW.id and owner_id=NEW.owner_id;
 insert into public.opportunity_people select NEW.owner_id,NEW.id,p from (select distinct unnest(NEW.person_ids) p) q;
 delete from public.opportunity_organizations where opportunity_id=NEW.id and owner_id=NEW.owner_id;
 insert into public.opportunity_organizations select NEW.owner_id,NEW.id,o from (select distinct unnest(NEW.organization_ids) o) q;
 return NEW;
end $$;
create trigger opportunity_links after insert or update on public.opportunities for each row execute function public.sync_opportunity_links();
create function public.cleanup_entity() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 delete from public.relationships where owner_id=OLD.owner_id and (from_id=OLD.id or to_id=OLD.id);
 if TG_TABLE_NAME='people' then
 update public.opportunities set person_ids=array_remove(person_ids,OLD.id) where owner_id=OLD.owner_id and OLD.id=any(person_ids);
 update public.activities set person_id=null where owner_id=OLD.owner_id and person_id=OLD.id;
 else update public.opportunities set organization_ids=array_remove(organization_ids,OLD.id) where owner_id=OLD.owner_id and OLD.id=any(organization_ids);end if;return OLD;
end $$;
create trigger person_cleanup before delete on public.people for each row execute function public.cleanup_entity();
create trigger organization_cleanup before delete on public.organizations for each row execute function public.cleanup_entity();
create function public.cleanup_opportunity() returns trigger language plpgsql security invoker set search_path='' as $$ begin update public.activities set opportunity_id=null where owner_id=OLD.owner_id and opportunity_id=OLD.id;return OLD;end $$;
create trigger opportunity_cleanup before delete on public.opportunities for each row execute function public.cleanup_opportunity();
-- One policy per table controls reads and every mutation. No service-role key in app.
do $$ declare t text;begin foreach t in array array['people','organizations','affiliations','relationships','facts','transactions','opportunities','activities','opportunity_people','opportunity_organizations'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner_only on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',t);
 execute format('create index on public.%I(owner_id)',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;end $$;
-- Bounded graph walk; co-membership never becomes a personal-introduction edge.
create function public.relationship_paths(start_id uuid,end_id uuid,max_depth int default 4)
returns table(path uuid[],labels text[]) language sql stable security invoker set search_path='' as $$
 with recursive walk(node,path,labels) as (
 select start_id,array[start_id],array[]::text[]
 where exists(select 1 from public.people where id=start_id and owner_id=auth.uid() union all select 1 from public.organizations where id=start_id and owner_id=auth.uid())
 union all
 select case when r.from_id=w.node then r.to_id else r.from_id end,w.path||case when r.from_id=w.node then r.to_id else r.from_id end,w.labels||r.label
 from walk w join public.relationships r on (r.from_id=w.node or r.to_id=w.node)
 where r.owner_id=auth.uid() and r.verification='Confirmed' and cardinality(w.path)<=least(greatest(max_depth,1),6)
 and not (case when r.from_id=w.node then r.to_id else r.from_id end=any(w.path))
 ) select path,labels from walk where node=end_id order by cardinality(path) limit 10;
$$;
revoke execute on function public.relationship_paths(uuid,uuid,int) from public;
grant execute on function public.relationship_paths(uuid,uuid,int) to authenticated;
