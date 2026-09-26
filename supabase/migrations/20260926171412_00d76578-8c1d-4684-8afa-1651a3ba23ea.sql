create table public.reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('lost','found')),
  category text not null,
  title text not null,
  description text not null default '',
  location_name text not null,
  map_x numeric not null default 50,
  map_y numeric not null default 50,
  occurred_at timestamptz not null default now(),
  photo text,
  fingerprint jsonb not null default '{}'::jsonb,
  safe_storage text,
  verify_question text,
  status text not null default 'searching',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert on public.reports to anon, authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports readable" on public.reports for select to anon, authenticated using (true);
create policy "reports insertable" on public.reports for insert to anon, authenticated with check (char_length(title) <= 120 and char_length(description) <= 1000);

create table public.report_secrets (
  report_id uuid primary key references public.reports(id) on delete cascade,
  answer text not null
);
grant all on public.report_secrets to service_role;
alter table public.report_secrets enable row level security;

create table public.find_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  map_x numeric not null,
  map_y numeric not null,
  items_in_storage int not null default 0,
  hours text not null default ''
);
grant select on public.find_points to anon, authenticated;
grant all on public.find_points to service_role;
alter table public.find_points enable row level security;
create policy "find points readable" on public.find_points for select to anon, authenticated using (true);

insert into public.find_points (name, kind, map_x, map_y, items_in_storage, hours) values
('Harbor Street Café','Café',32,38,2,'7am – 8pm'),
('Central Library','Library',58,26,4,'9am – 9pm'),
('Riverside Mall — Info Desk','Mall',71,62,6,'10am – 10pm'),
('North Campus Security','University',22,18,3,'24 hours'),
('Elm Park Gym','Gym',46,72,1,'6am – 11pm'),
('Market Square Grocers','Local store',84,34,0,'8am – 9pm');

insert into public.reports (kind, category, title, description, location_name, map_x, map_y, occurred_at, fingerprint, safe_storage, verify_question, status, is_demo) values
('found','Bags','Black backpack with blue keychain','Black laptop backpack found on a bench. Stored safely at the café counter.','Near Harbor Street Café',34,40, now() - interval '1 day','{"color":"black","shape":"backpack","brand":"visible logo","accessories":["blue keychain"],"features":["laptop sleeve","side pocket"]}','Harbor Street Café','What is attached to the zipper?','searching',true),
('found','Phones','Smartphone in green case','Phone with cracked corner found at the bus stop.','Elm Park bus stop',48,68, now() - interval '3 hours','{"color":"green","shape":"phone","accessories":["case"],"features":["cracked corner"]}','Elm Park Gym','What is the lock-screen wallpaper?','searching',true),
('found','Keys','Key ring with 3 keys','Silver keys with a small leather tag.','Central Library, 2nd floor',57,29, now() - interval '2 days','{"color":"silver","shape":"key ring","accessories":["leather tag"],"features":["3 keys"]}','Central Library','What is written on the tag?','searching',true),
('found','Wallets','Brown leather wallet','Bifold wallet, found near the food court.','Riverside Mall food court',70,60, now() - interval '5 hours','{"color":"brown","shape":"bifold wallet","brand":"leather","features":["worn edges"]}','Riverside Mall — Info Desk','What card is in the front slot?','searching',true),
('lost','Electronics','Silver laptop','13-inch laptop with space stickers.','North Campus lecture hall',24,21, now() - interval '1 day','{"color":"silver","shape":"laptop","features":["space stickers"]}',null,null,'searching',true),
('lost','Documents','Passport in red cover','Red passport cover, lost near the market.','Market Square',82,37, now() - interval '6 hours','{"color":"red","shape":"passport"}',null,null,'searching',true),
('found','Other','Blue umbrella','Compact blue umbrella with wooden handle.','Harbor Street',29,47, now() - interval '8 hours','{"color":"blue","shape":"umbrella","features":["wooden handle"]}',null,'What color is the strap?','searching',true);

insert into public.report_secrets (report_id, answer)
select id, case category when 'Bags' then 'blue keychain' when 'Phones' then 'mountains' when 'Keys' then 'home' when 'Wallets' then 'library card' else 'black' end
from public.reports where kind='found';