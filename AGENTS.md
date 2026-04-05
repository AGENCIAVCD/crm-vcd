<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# VCD-CRM Operating Manual

## Read This First

Este arquivo e a fonte de contexto permanente do projeto.
Antes de qualquer acao no repositorio:

1. Ler este arquivo por completo.
2. Ler `DESIGN_SYSTEM.md` por completo antes de qualquer mudanca de UI, UX, componente visual ou pagina.
3. Preservar a arquitetura SaaS multi-tenant.
4. Nao escrever nada que permita vazamento entre tenants.
5. Respeitar a estrutura atual de pastas e convencoes.
6. Ao final de mudancas de codigo, validar com `npm run lint`, `npm run typecheck` e `npm run build`.
7. Se houve mudanca em React/Next client components, rodar tambem `npx -y react-doctor@latest . --verbose --diff`.

Se o codigo mudar de forma relevante, este arquivo deve ser atualizado junto.

Regra ativa de produto:

- a primeira tela para visitantes deve ser `/login`
- nenhuma rota de CRM pode ser acessada sem sessao valida
- fallback demo nao deve liberar acesso a visitantes

Regra ativa de design:

- `DESIGN_SYSTEM.md` e a fonte de verdade visual do projeto
- se houver conflito entre UI atual e o design system, vence o design system
- toda interface nova deve usar a identidade da Voce Digital Propaganda

## Product Goal

Construir o `VCD-CRM`, um CRM SaaS multi-tenant ultrarrapido, inspirado em Kommo e ActiveCampaign.

Contexto atual:

- Primeiro uso real: `Voce Digital Propaganda`.
- Estrategia: dogfooding interno primeiro, produto SaaS depois.
- Regra central: o projeto pode operar com fallback demo, mas a arquitetura deve nascer pronta para isolamento real por `tenant_id`.

## Tech Stack

- Frontend: Next.js App Router, React 19, TypeScript.
- Estilo: Tailwind CSS v4.
- UI base: Radix UI, Lucide React.
- Kanban: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- Backend/BaaS: Supabase.
- Banco: PostgreSQL com RLS.
- Deploy alvo: Vercel.

## Design Source Of Truth

- Documento principal: `DESIGN_SYSTEM.md`
- Marca: Voce Digital Propaganda
- Direcao visual: alto contraste, preto + amarelo, hierarquia forte, foco comercial

## Current Project Structure

```text
/DESIGN_SYSTEM.md
/src
  /app
    /(auth)
      /login/page.tsx
    /(crm)
      /layout.tsx
      /dashboard/page.tsx
      /pipelines/[id]/page.tsx
    /api
      /pipelines
        /stage-integration/route.ts
      /webhooks
        /site/route.ts
        /whatsapp/route.ts
    /layout.tsx
    /page.tsx
  /components
    /kanban
      Board.tsx
      CreateLeadDialog.tsx
      StageConfigDialog.tsx
      Column.tsx
      LeadCard.tsx
    /lead-modal
      LeadDetails.tsx
      WhatsAppChat.tsx
    /providers
      auth-provider.tsx
    /ui
      dialog.tsx
      scroll-area.tsx
  /lib
    demo-data.ts
    supabase-client.ts
    supabase-server.ts
    utils.ts
  /types
    crm.ts
    database.ts
/supabase
  /migrations
    202604020001_vcd_crm_init.sql
```

## What Is Already Implemented

### Base app

- Projeto Next.js inicializado e funcionando.
- Estrutura App Router separada em `(auth)` e `(crm)`.
- Dashboard visual inicial.
- Rota raiz redirecionando para `/dashboard`.

### Authentication context

- `AuthProvider` criado.
- Quando Supabase estiver ativo, o provider le `auth.user` e busca o perfil em `public.users`.
- O contexto exposto contem `user`, `profile`, `tenantId`, `isLoading` e `refreshProfile`.

### Access control

- `src/proxy.ts` protege `/`, `/dashboard` e `/pipelines/*`.
- `src/app/(crm)/layout.tsx` reforca o bloqueio no servidor.
- `src/app/(auth)/login/page.tsx` redireciona usuarios autenticados para `/dashboard`.
- Visitantes nao autenticados devem sempre cair em `/login`.

### Kanban

- Tela principal do pipeline em `/pipelines/[id]`.
- `Board.tsx` usa `dnd-kit`.
- Drag and drop com update otimista.
- Realtime configurado para ouvir a tabela `leads`.
- Cadastro manual de lead direto pelo pipeline.
- Criacao e configuracao de etapa direto pelo pipeline.
- Cada etapa pode armazenar resumo operacional e webhook proprio.
- `LeadCard.tsx` calcula SLA visual:
  - amarelo acima de 24h.
  - vermelho acima de 48h.
- Modal de lead abre detalhes e o chat.

### WhatsApp chat

- Chat visual estilo WhatsApp Web.
- Assinatura Realtime na tabela `messages` por `lead_id`.
- Envio chama a rota interna `POST /api/webhooks/whatsapp`.
- A rota salva a mensagem no Supabase e tenta enviar pela Meta Cloud API quando as credenciais estiverem configuradas.
- Quando a Meta ainda nao estiver ligada, a mensagem continua salva como historico local do lead.

### Lead operations

- `LeadDetails.tsx` permite editar nome, telefone, e-mail, valor e observacoes.
- O campo `observacoes` e persistido em `public.leads.notes`.
- Toda alteracao relevante do lead atualiza `last_interaction_at`.

### Stage operations

- `StageConfigDialog.tsx` cria novas etapas no fim do pipeline.
- Cada etapa pode configurar:
  - `description`
  - `integration_enabled`
  - `integration_label`
  - `integration_webhook_url`
- A rota `POST /api/pipelines/stage-integration` dispara um webhook quando um lead entra em uma etapa configurada.

### Webhook inbound do site

- `POST /api/webhooks/site` implementado.
- Payload aceito:

```json
{
  "name": "Lead Exemplo",
  "phone": "+55 11 99999-9999",
  "email": "lead@exemplo.com",
  "value": 2500,
  "tenantKey": "vcd-internal-dogfood",
  "pipelineId": "uuid-opcional"
}
```

- Resolve o tenant com base em `DEFAULT_WEBHOOK_TENANT_KEY`.
- Busca a primeira stage do pipeline.
- Cria o lead na primeira coluna.

### Database and RLS

- Migration inicial criada em `supabase/migrations/202604020001_vcd_crm_init.sql`.
- Tabelas:
  - `tenants`
  - `users`
  - `pipelines`
  - `stages`
  - `leads`
  - `messages`
- Campos operacionais adicionados:
  - `leads.notes`
  - `stages.description`
  - `stages.integration_enabled`
  - `stages.integration_label`
  - `stages.integration_webhook_url`
- Indices principais criados.
- Funcoes `current_tenant_id()` e `is_tenant_admin()` criadas.
- RLS habilitado em todas as tabelas.
- Publicacao Realtime habilitada para `leads` e `messages`.

### Demo mode

- O projeto possui dados fake em `src/lib/demo-data.ts`.
- O modo demo existe para nao travar o hackathon antes da configuracao real do Supabase.
- O modo demo nunca deve substituir a arquitetura multi-tenant real; ele e apenas fallback local.

## Non-Negotiable Architecture Rules

### Multi-tenant isolation

- Toda tabela de dominio deve carregar `tenant_id`.
- Toda query de leitura e escrita deve respeitar `tenant_id`.
- Nenhuma tela pode misturar dados de tenants diferentes.
- Nenhuma rota privada pode depender de fallback demo para autorizar acesso.
- Nenhum componente client pode usar `SUPABASE_SERVICE_ROLE_KEY`.
- `service role` so pode ser usado em rotas server-side, webhooks ou jobs controlados.
- Se uma nova funcionalidade tocar dados de CRM, avaliar se precisa de RLS, indice e Realtime.

### Supabase rules

- Mudou schema: atualizar migration e tipos em `src/types/database.ts`.
- Mudou autenticacao: preservar relacao `auth.users -> public.users`.
- Mudou eventos em tempo real: verificar se a tabela esta na publication `supabase_realtime`.

### Kanban rules

- O Kanban e o coracao do produto.
- Mudancas em drag and drop devem priorizar fluidez antes de refinamentos secundarios.
- Toda mudanca de stage deve manter `last_interaction_at` coerente.
- Realtime deve refletir mudancas sem reload de pagina.

### WhatsApp rules

- Toda conversa deve ser vinculada a um `lead_id`.
- Mensagens inbound e outbound devem ser persistidas.
- A integracao com a Meta deve passar por rota interna do app.
- Se a integracao real da Meta for concluida, manter persistencia local como fonte de historico.

## Environment Contract

Arquivo base: `.env.example`

Variaveis previstas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_DEFAULT_TENANT_ID`
- `NEXT_PUBLIC_DEFAULT_PIPELINE_ID`
- `DEFAULT_TENANT_ID`
- `DEFAULT_PIPELINE_ID`
- `DEFAULT_WEBHOOK_TENANT_KEY`
- `META_WHATSAPP_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_GRAPH_API_VERSION`

## What Is Missing

## Missing To Run With Real Supabase

- Criar projeto Supabase real.
- Preencher `.env.local` com as variaveis corretas.
- Rodar a migration inicial no Supabase.
- Aplicar seed inicial com:
  - 1 tenant da Voce Digital Propaganda.
  - 1 pipeline.
  - stages iniciais ordenadas.
- Criar o primeiro admin em `auth.users` e `public.users`.
- Confirmar que `leads` e `messages` estao mesmo publicados no Realtime do ambiente real.

Status atual:

- projeto Supabase remoto criado e linkado: `jljoawmczmwrdgugrtqz`
- migration inicial aplicada com `supabase db push`
- `.env.local` configurado localmente
- `supabase/seed.sql` criado
- `scripts/seed-supabase.mjs` criado para seed remoto via service role
- `scripts/bootstrap-admin.mjs` criado para bootstrap do primeiro admin

## Missing For MVP Comercial Real

- Middleware/guard de autenticacao para proteger rotas privadas.
- Carregamento server-side da sessao quando for sair do modo demo.
- CRUD real de pipelines.
- CRUD completo de stages:
  - reordenar
  - excluir com seguranca
- CRUD completo de leads:
  - excluir
  - ownership `assigned_to`
  - historico mais rico alem de observacoes
- Atualizacao de `assigned_to`.
- Dashboard puxando metricas reais do banco.
- Campos customizados do lead alem de `notes`.
- Filtros, busca e ordenacao do pipeline.
- Historico extra alem de mensagens, como notas, tarefas e atividades.

## Missing For WhatsApp Real

- Criar `/api/webhooks/whatsapp/inbound` para receber mensagens da Meta.
- Validar assinatura do webhook da Meta.
- Persistir mensagens inbound reais na tabela `messages`.
- Tratar falhas, retentativas e status de entrega.

## Missing For Security And Production

- Rate limiting nos webhooks.
- Idempotencia para evitar leads duplicados em reenvios.
- Sanitizacao e validacao extra de payloads externos.
- Logging observavel para APIs e webhooks.
- Politica de erro e retry para integracoes externas.
- Segredo de tenant inbound mais robusto que chave simples, se o produto for exposto publicamente.

## Missing For Quality

- Testes unitarios dos helpers e regras de SLA.
- Testes de integracao das rotas `/api/webhooks/site` e `/api/webhooks/whatsapp`.
- Testes E2E do fluxo login -> dashboard -> pipeline -> mover lead -> abrir modal.
- Seed script reproducivel para desenvolvimento.

## Default Priorities For Future Work

Seguir esta ordem, salvo instrucao explicita em contrario:

1. Ligar Supabase real e seed inicial.
2. Proteger autenticacao e rotas privadas.
3. Finalizar pipeline CRUD e lead CRUD.
4. Integrar WhatsApp real.
5. Melhorar dashboard e automacoes.
6. Adicionar testes e endurecimento de producao.

## File Responsibilities

### `src/lib/supabase-client.ts`

- Cliente browser do Supabase.
- Nunca colocar `service role` aqui.

### `src/lib/supabase-server.ts`

- Cliente server-side com `service role`.
- Usar somente em rotas seguras no servidor.

### `src/components/providers/auth-provider.tsx`

- Contexto de autenticacao e tenant atual.
- Toda mudanca em auth deve preservar `tenantId`.

### `src/components/kanban/*`

- Motor do board, colunas e cards.
- Prioridade maxima em UX e sincronizacao do pipeline.
- Tambem concentra a entrada manual de leads e a configuracao basica de etapas.

### `src/components/lead-modal/*`

- Modal do lead, dados do lead e conversa.

### `src/app/api/webhooks/site/route.ts`

- Entrada de leads vindos do site.

### `src/app/api/webhooks/whatsapp/route.ts`

- Saida controlada de mensagem para WhatsApp.
- Salva historico local primeiro e tenta despacho real para Meta quando configurada.

### `src/app/api/pipelines/stage-integration/route.ts`

- Dispara webhook de automacao quando um lead entra em etapa com integracao ativa.
- Deve sempre validar tenant e sessao antes de tocar dados do CRM.

### `supabase/migrations/*`

- Fonte oficial de schema.
- Se o banco mudar, este diretorio deve refletir a verdade.

### `supabase/seed.sql`

- Seed idempotente do tenant e pipeline padrao.
- Deve continuar seguro para reexecucao.

### `scripts/seed-supabase.mjs`

- Aplica seed remoto usando `SUPABASE_SERVICE_ROLE_KEY`.

### `scripts/bootstrap-admin.mjs`

- Cria ou atualiza o primeiro usuario administrativo.
- Deve manter sincronia entre `auth.users` e `public.users`.

## Mandatory Workflow For Any Future Change

1. Ler este `AGENTS.md`.
2. Se tocar front/UI, ler `DESIGN_SYSTEM.md`.
3. Ler os arquivos diretamente afetados.
4. Se tocar banco, revisar impacto em `tenant_id`, RLS, indices e tipos.
5. Se tocar pipeline, preservar drag and drop, SLA e Realtime.
6. Se tocar chat, preservar persistencia e filtro por `lead_id`.
7. Fazer a menor mudanca coerente com a arquitetura.
8. Validar localmente.
9. Atualizar este arquivo se a regra do projeto tiver mudado.

## Definition Of Done

Uma tarefa so esta concluida se:

- O codigo compila.
- `npm run lint` passou.
- `npm run typecheck` passou.
- `npm run build` passou.
- Se houve mudanca React/client, `react-doctor` foi rodado.
- Nao houve quebra da arquitetura multi-tenant.
- O contexto deste arquivo continua verdadeiro.

## Current Local Validation Status

Ultima validacao feita em `2026-04-04`:

- `npm run lint`: ok
- `npm run typecheck`: ok
- `npm run build`: ok
- `npx -y react-doctor@latest . --verbose --diff`: 99/100

## Note For Future Agents

Nao tratar o projeto como um template generico de CRM.
Este repositorio ja tem direcao definida:

- foco em execucao rapida;
- UX forte no Kanban;
- identidade visual forte da Voce Digital Propaganda;
- dogfooding primeiro;
- isolamento multi-tenant desde o dia zero;
- integracao de WhatsApp como parte central do produto.

Se houver conflito entre conveniencia tecnica e isolamento por tenant, vence o isolamento por tenant.
