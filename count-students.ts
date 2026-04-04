import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.user.count({ where: { role: 'STUDENT' } })
  console.log('STUDENT_COUNT:', count)
}

main().catch(console.error).finally(() => prisma.$disconnect())
