// test.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Testando conexão com o banco...')
    
    // Tenta uma query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    console.log('✅ Conexão funcionou!')
    console.log('Resultado:', result)
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()