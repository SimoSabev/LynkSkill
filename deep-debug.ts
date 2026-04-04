import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { OR: [ { email: 'ssabev@enlapse.com' }, { email: 'sabevsimeon08@gmail.com' } ] },
    include: {
        portfolio: true,
        projects: true
    }
  })
  
  if (!user) {
    console.log('CANDIDATE_NOT_FOUND')
    return
  }

  console.log('Role:', user.role)
  console.log('Skills:', user.portfolio?.skills)
  console.log('Headline:', user.portfolio?.headline)
  
  // Test the matching logic
  const skillNormalized = "multi agent systems"
  const studentTextPieces = [
    ...(user.portfolio?.skills || []),
    user.portfolio?.headline || ""
  ].map(t => t.toLowerCase().replace(/[^a-z0-9 ]/g, " "))
  
  const hasPhrase = studentTextPieces.some(p => p.includes(skillNormalized) || skillNormalized.includes(p))
  console.log('Test Match Phrase "multi agent systems":', hasPhrase)

  const skillWords = skillNormalized.split(/\s+/).filter(w => w.length > 2)
  const fullStudentText = studentTextPieces.join(" ")
  const studentWords = fullStudentText.split(/\s+/).filter(w => w.length > 2)
  let matchedWordsCount = 0
  for (const sw of skillWords) {
      if (studentWords.some(w => w.includes(sw) || sw.includes(w))) {
          matchedWordsCount++
      }
  }
  console.log('Test Match Tokens Ratio:', matchedWordsCount / skillWords.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
