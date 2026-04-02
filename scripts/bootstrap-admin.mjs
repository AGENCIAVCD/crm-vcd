import { createClient } from "@supabase/supabase-js";

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DEFAULT_TENANT_ID",
];

for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

function getArg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return fallback;
  }

  return process.argv[index + 1] ?? fallback;
}

const email = getArg("--email");
const password = getArg("--password");
const fullName = getArg("--name", "Bruno Ravaglia");
const role = getArg("--role", "admin");
const tenantId = getArg("--tenant-id", process.env.DEFAULT_TENANT_ID);

if (!email || !password) {
  console.error(
    "Usage: npm run bootstrap:admin -- --email bruno@vcdigital.com.br --password 'SuaSenhaForte' [--name 'Bruno Ravaglia'] [--role admin]",
  );
  process.exit(1);
}

if (!["admin", "user"].includes(role)) {
  console.error("Role must be either 'admin' or 'user'.");
  process.exit(1);
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

async function findUserByEmail(targetEmail) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find((candidate) => candidate.email === targetEmail);

    if (user) {
      return user;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser() {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error) {
      throw error;
    }

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function main() {
  const authUser = await ensureAuthUser();

  const { error: profileError } = await supabase.from("users").upsert(
    {
      id: authUser.id,
      tenant_id: tenantId,
      full_name: fullName,
      role,
    },
    {
      onConflict: "id",
    },
  );

  if (profileError) {
    throw profileError;
  }

  console.log("Admin bootstrap completed.");
  console.log(`email=${email}`);
  console.log(`user_id=${authUser.id}`);
  console.log(`tenant_id=${tenantId}`);
  console.log(`role=${role}`);
}

main().catch((error) => {
  console.error("Failed to bootstrap admin user.");
  console.error(error);
  process.exitCode = 1;
});
