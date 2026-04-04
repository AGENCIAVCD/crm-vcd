alter table public.leads
add column if not exists notes text;

alter table public.stages
add column if not exists description text;

alter table public.stages
add column if not exists integration_enabled boolean not null default false;

alter table public.stages
add column if not exists integration_label text;

alter table public.stages
add column if not exists integration_webhook_url text;
