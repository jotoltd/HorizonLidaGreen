const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

const SUPABASE_URL = "https://kdqxwkrklmojuvczluks.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcXh3a3JrbG1vanV2Y3psdWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTQ2ODc5MiwiZXhwIjoyMTA1MDQ0NzkyfQ.ehkdnvZx6x4V92pMkNut3HJ_R1whbRjc9SP36ebxPaE";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

async function main() {
  const adminEmail = "junyi.liang@horizonlidagreen.com";

  // Check if admin exists
  const { data: existing } = await supabase.from("User").select("id").eq("email", adminEmail).single();

  if (existing) {
    // Update password
    await supabase.from("User").update({ passwordHash: hashPassword("123456") }).eq("id", existing.id);
    console.log("✓ Admin user updated:", adminEmail);
  } else {
    // Create admin
    const { error } = await supabase.from("User").insert({
      email: adminEmail,
      name: "Junyi Liang",
      role: "ADMIN",
      company: "Horizon Lida Green",
      passwordHash: hashPassword("123456"),
    });
    if (error) { console.error(error); process.exit(1); }
    console.log("✓ Admin user created:", adminEmail);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => process.exit(0));
