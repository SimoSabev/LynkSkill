import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { 
      OR: [
        { email: { contains: 'sabev' } },
        { profile: { name: { contains: 'Sabev' } } }
      ]
    },
    include: {
      profile: true,
      portfolio: true
    }
  })
  
  if (users.length === 0) {
    console.log('No user found matching "sabev"')
    return
  }

  users.forEach(u => {
    console.log(`User: ${u.email}`)
    console.log(`Skills: ${JSON.stringify(u.portfolio?.skills)}`)
    console.log(`Interests: ${JSON.stringify(u.portfolio?.interests)}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
