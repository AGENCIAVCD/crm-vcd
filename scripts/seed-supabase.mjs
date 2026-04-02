import { createClient } from "@supabase/supabase-js";

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DEFAULT_TENANT_ID",
  "DEFAULT_PIPELINE_ID",
];

for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const tenantId = process.env.DEFAULT_TENANT_ID;
const pipelineId = process.env.DEFAULT_PIPELINE_ID;

const stages = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    pipeline_id: pipelineId,
    tenant_id: tenantId,
    name: "Entrada",
    position: 0,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    pipeline_id: pipelineId,
    tenant_id: tenantId,
    name: "Diagnostico",
    position: 1,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    pipeline_id: pipelineId,
    tenant_id: tenantId,
    name: "Proposta",
    position: 2,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    pipeline_id: pipelineId,
    tenant_id: tenantId,
    name: "Fechamento",
    position: 3,
  },
];

async function main() {
  const { error: tenantError } = await supabase.from("tenants").upsert(
    {
      id: tenantId,
      name: "Voce Digital Propaganda",
    },
    {
      onConflict: "id",
    },
  );

  if (tenantError) {
    throw tenantError;
  }

  const { error: pipelineError } = await supabase.from("pipelines").upsert(
    {
      id: pipelineId,
      tenant_id: tenantId,
      name: "Pipeline Comercial Principal",
    },
    {
      onConflict: "id",
    },
  );

  if (pipelineError) {
    throw pipelineError;
  }

  const { error: stagesError } = await supabase.from("stages").upsert(stages, {
    onConflict: "id",
  });

  if (stagesError) {
    throw stagesError;
  }

  console.log("Supabase remote seed applied successfully.");
  console.log(`tenant_id=${tenantId}`);
  console.log(`pipeline_id=${pipelineId}`);
  console.log(`stages=${stages.length}`);
}

main().catch((error) => {
  console.error("Failed to apply remote seed.");
  console.error(error);
  process.exitCode = 1;
});
