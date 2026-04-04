import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const semanticQuery = "Multi-Agent Systems"
  const expandedSkills = [ "multi agent systems", "multiagent systems", "agents", "multi-agent", "autonomous agents" ].map(s => s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, " "))
  
  console.log("Simulating expansion for:", semanticQuery)
  console.log("Expanded skills:", expandedSkills)

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: {
        portfolio: true,
        projects: true
    }
  })

  console.log(`Found ${students.length} students`)

  const matches = students.map(student => {
    let score = 0
    const studentTextPieces = [
        ...(student.portfolio?.skills || []),
        ...(student.portfolio?.interests || []),
        student.portfolio?.bio || "",
        student.portfolio?.headline || "",
        student.portfolio?.experience || "",
        ...(student.projects?.map((p: any) => `${p.title} ${p.description} ${(p.technologies || []).join(" ")}`) || [])
    ].map(t => t.toLowerCase().replace(/[^a-z0-9 ]/g, " "))

    for (const skill of expandedSkills) {
        const skillNormalized = skill.toLowerCase()
        const hasPhrase = studentTextPieces.some(p => p.includes(skillNormalized) || skillNormalized.includes(p))
        if (hasPhrase) {
            score += 35
        }
    }
    
    return { email: student.email, score }
  })

  const results = matches.filter(m => m.score > 15).sort((a,b) => b.score - a.score)
  console.log("Matches found:", JSON.stringify(results, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
