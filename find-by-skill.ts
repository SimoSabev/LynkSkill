import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: {
      portfolio: {
        skills: {
          has: 'Multi-Agent Systems'
        }
      }
    },
    select: {
      email: true,
      role: true,
      portfolio: { select: { skills: true } }
    }
  })
  
  console.log('Users with "Multi-Agent Systems":', JSON.stringify(users, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
