-- Initial dogfooding seed for VCD-CRM.
-- Idempotent inserts keep local and remote setup repeatable.

insert into public.tenants (id, name)
values ('30000000-0000-4000-8000-000000000001', 'Voce Digital Propaganda')
on conflict (id) do update
set name = excluded.name;

insert into public.pipelines (id, tenant_id, name)
values (
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  'Pipeline Comercial Principal'
)
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  name = excluded.name;

insert into public.stages (id, pipeline_id, tenant_id, name, position)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Entrada',
    0
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Diagnostico',
    1
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Proposta',
    2
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Fechamento',
    3
  )
on conflict (id) do update
set
  pipeline_id = excluded.pipeline_id,
  tenant_id = excluded.tenant_id,
  name = excluded.name,
  position = excluded.position;
