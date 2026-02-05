/**
 * Script to backfill existing companies with invitation codes
 * Run with: npx tsx scripts/backfill-company-codes.ts
 */

import { prisma } from "../lib/prisma"
import { generateCompanyCode } from "../lib/company-code"

async function main() {
  console.log("🔄 Starting company code backfill...")

  // Find all companies without invitation codes
  const companiesWithoutCodes = await prisma.company.findMany({
    where: { invitationCode: null },
    select: { id: true, name: true },
  })

  console.log(`Found ${companiesWithoutCodes.length} companies without codes`)

  let updated = 0
  let failed = 0

  for (const company of companiesWithoutCodes) {
    try {
      const code = generateCompanyCode()
      
      await prisma.company.update({
        where: { id: company.id },
        data: { 
          invitationCode: code,
          codeEnabled: true,
          codeUsageCount: 0,
        },
      })

      console.log(`✅ Updated ${company.name}: ${code}`)
      updated++
    } catch (error) {
      console.error(`❌ Failed to update ${company.name}:`, error)
      failed++
    }
  }

  console.log("\n📊 Summary:")
  console.log(`  Updated: ${updated}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Total: ${companiesWithoutCodes.length}`)
}

main()
  .catch((e) => {
    console.error("Script failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
