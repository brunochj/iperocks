// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed com dados reais...\n')

  // 1. Importar setores
  const setoresPath = path.join(process.cwd(), 'data', 'sectors.json')
  const setores = JSON.parse(fs.readFileSync(setoresPath, 'utf-8'))
  console.log(`📁 Importando ${setores.length} setores...`)

  for (const setor of setores) {
    await prisma.sector.upsert({
      where: { id: setor.id },
      update: {},
      create: {
        id: setor.id,
        name: setor.name,
        description: setor.description || '',
        imageUrl: setor.imageUrl || null,
        order: setor.order || 0,
      }
    })
  }
  console.log('✅ Setores importados')

  // 2. Importar blocos
  const blocosPath = path.join(process.cwd(), 'data', 'blocks.json')
  const blocos = JSON.parse(fs.readFileSync(blocosPath, 'utf-8'))
  console.log(`🪨 Importando ${blocos.length} blocos...`)

  for (const bloco of blocos) {
    await prisma.block.upsert({
      where: { id: bloco.id },
      update: {},
      create: {
        id: bloco.id,
        name: bloco.name,
        description: bloco.description || '',
        imageUrl: bloco.imageUrl || null,
        order: bloco.order || 0,
        sectorId: bloco.sectorId,
      }
    })
  }
  console.log('✅ Blocos importados')

  // 3. Importar linhas
  const linhasPath = path.join(process.cwd(), 'data', 'lines.json')
  const linhas = JSON.parse(fs.readFileSync(linhasPath, 'utf-8'))
  console.log(`🧗 Importando ${linhas.length} linhas...`)

  for (const linha of linhas) {
    await prisma.line.upsert({
      where: { id: linha.id },
      update: {},
      create: {
        id: linha.id,
        name: linha.name,
        grade: linha.grade,
        description: linha.description || '',
        imageUrl: linha.imageUrl || null,
        topoImage: linha.topoImage || null,
        isProject: linha.isProject || false,
        isClosed: linha.isClosed || false,
        stars: linha.stars || 0,
        blockId: linha.blockId,
      }
    })
  }
  console.log('✅ Linhas importadas')

  // 4. Criar usuário admin (opcional)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@iperocks.com' },
    update: {},
    create: {
      email: 'admin@iperocks.com',
      name: 'Admin Iperocks',
      rulesAccepted: true,
    }
  })
  console.log('✅ Usuário admin criado')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log(`📊 Estatísticas:`)
  console.log(`   - ${setores.length} setores`)
  console.log(`   - ${blocos.length} blocos`)
  console.log(`   - ${linhas.length} linhas`)
  console.log(`   - 1 usuário admin`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())