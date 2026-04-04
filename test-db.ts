import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { 
      email: { contains: 'sabev' } 
    },
    include: {
      profile: true,
      portfolio: true,
      projects: true,
      aiProfile: { include: { confidenceScore: true } }
    }
  })
  console.log(JSON.stringify(users, null, 2))
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
