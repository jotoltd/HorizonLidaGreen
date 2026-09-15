const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

async function main() {
  const adminEmail = "junyi.liang@horizonlidagreen.com";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Junyi Liang",
      role: "ADMIN",
      company: "Horizon Lida Green",
      passwordHash: hashPassword("123456"),
    },
  });
  console.log("✓ Admin user ready:", adminEmail);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
