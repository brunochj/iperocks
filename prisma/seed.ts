// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed com dados reais...\n')

  // 1. Setores (upsert por id)
  const sectorsPath = path.join(process.cwd(), 'data', 'sectors.json')
  const sectors = JSON.parse(fs.readFileSync(sectorsPath, 'utf-8'))
  console.log(`📁 Importando ${sectors.length} setores...`)
  for (const sector of sectors) {
    await prisma.sector.upsert({
      where: { id: sector.id },
      update: {
        name: sector.name,
        description: sector.description ?? '',
        order: sector.order ?? 0,
      },
      create: {
        id: sector.id,
        name: sector.name,
        description: sector.description ?? '',
        order: sector.order ?? 0,
      },
    })
  }
  console.log('✅ Setores importados')

  // 2. Blocos (upsert por id – setores já devem existir)
  const blocksPath = path.join(process.cwd(), 'data', 'blocks.json')
  const blocks = JSON.parse(fs.readFileSync(blocksPath, 'utf-8'))
  console.log(`🪨 Importando ${blocks.length} blocos...`)
  for (const block of blocks) {
    await prisma.block.upsert({
      where: { id: block.id },
      update: {
        name: block.name,
        description: block.description ?? '',
        order: block.order ?? 0,
        sectorId: block.sectorId,
      },
      create: {
        id: block.id,
        name: block.name,
        description: block.description ?? '',
        order: block.order ?? 0,
        sectorId: block.sectorId,
      },
    })
  }
  console.log('✅ Blocos importados')

  // 3. Linhas (upsert por id – blocos já devem existir)
  const linesPath = path.join(process.cwd(), 'data', 'lines.json')
  const lines = JSON.parse(fs.readFileSync(linesPath, 'utf-8'))
  console.log(`🧗 Importando ${lines.length} linhas...`)
  for (const line of lines) {
    await prisma.line.upsert({
      where: { id: line.id },
      update: {
        name: line.name,
        grade: line.grade,
        description: line.description ?? '',
        imageUrl: line.imageUrl ?? null,
        blockId: line.blockId,
      },
      create: {
        id: line.id,
        name: line.name,
        grade: line.grade,
        description: line.description ?? '',
        imageUrl: line.imageUrl ?? null,
        blockId: line.blockId,
      },
    })
  }
  console.log('✅ Linhas importadas')

  // 4. Usuário admin (opcional, mantém)
  const adminEmail = 'admin@iperocks.com'
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      username: 'admin_iperocks',
      name: 'Admin Iperocks',
      bio: 'Administrador do sistema',
      rulesAccepted: true,
      rulesVersion: '1.0',
      rulesAcceptedAt: new Date(),
    },
    create: {
      email: adminEmail,
      username: 'admin_iperocks',
      name: 'Admin Iperocks',
      bio: 'Administrador do sistema',
      rulesAccepted: true,
      rulesVersion: '1.0',
      rulesAcceptedAt: new Date(),
    },
  })
  console.log('✅ Usuário admin criado/atualizado')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log(`📊 Estatísticas:`)
  console.log(`   - ${sectors.length} setores`)
  console.log(`   - ${blocks.length} blocos`)
  console.log(`   - ${lines.length} linhas`)
  console.log(`   - 1 usuário admin`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())