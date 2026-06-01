// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed com dados reais...\n')

  // 1. Setores
  const sectorsPath = path.join(process.cwd(), 'data', 'sectors.json')
  const sectors = JSON.parse(fs.readFileSync(sectorsPath, 'utf-8'))
  console.log(`📁 Importando ${sectors.length} setores...`)
  for (const sector of sectors) {
    await prisma.sector.upsert({
      where: { id: sector.id },
      update: { name: sector.name, description: sector.description, order: sector.order },
      create: { id: sector.id, name: sector.name, description: sector.description, order: sector.order },
    })
  }
  console.log('✅ Setores importados')

  // 2. Blocos
  const blocksPath = path.join(process.cwd(), 'data', 'blocks.json')
  const blocks = JSON.parse(fs.readFileSync(blocksPath, 'utf-8'))
  console.log(`🪨 Importando ${blocks.length} blocos...`)
  for (const block of blocks) {
    await prisma.block.upsert({
      where: { id: block.id },
      update: { name: block.name, description: block.description, order: block.order, sectorId: block.sectorId },
      create: { id: block.id, name: block.name, description: block.description, order: block.order, sectorId: block.sectorId },
    })
  }
  console.log('✅ Blocos importados')

  // 3. Linhas
  const linesPath = path.join(process.cwd(), 'data', 'lines.json')
  const lines = JSON.parse(fs.readFileSync(linesPath, 'utf-8'))
  console.log(`🧗 Importando ${lines.length} linhas...`)
  for (const line of lines) {
    await prisma.line.upsert({
      where: { id: line.id },
      update: { name: line.name, grade: line.grade, description: line.description, imageUrl: line.imageUrl, blockId: line.blockId },
      create: { id: line.id, name: line.name, grade: line.grade, description: line.description, imageUrl: line.imageUrl, blockId: line.blockId },
    })    
  }
  console.log('✅ Linhas importadas')

  // 4. Usuário admin (para associar os alertas)
  const adminEmail = 'admin@iperocks.com'
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin Iperocks',
      username: 'admin_iperocks',
      rulesAccepted: true,
    },
  })
  console.log('✅ Usuário admin criado/atualizado')

  // 5. Alertas
  const alertsPath = path.join(process.cwd(), 'data', 'alerts.json')
  if (fs.existsSync(alertsPath)) {
    const alerts = JSON.parse(fs.readFileSync(alertsPath, 'utf-8'))
    console.log(`⚠️ Importando ${alerts.length} alertas...`)
    for (const alert of alerts) {
      // Garantir que o userId seja o do admin (se não veio no JSON)
      if (!alert.userId) alert.userId = admin.id
      await prisma.alert.upsert({
        where: { id: alert.id },
        update: { type: alert.type, description: alert.description, resolved: alert.resolved, lineId: alert.lineId, userId: admin.id },
        create: { id: alert.id, type: alert.type, description: alert.description, resolved: alert.resolved, lineId: alert.lineId, userId: admin.id },
      })
    }
    console.log('✅ Alertas importados')
  } else {
    console.log('⚠️ Nenhum arquivo alerts.json encontrado. Pulando...')
  }

  console.log('\n🎉 Seed concluído com sucesso!')
}
main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())