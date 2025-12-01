require('dotenv').config()
const { master } = require('../src/prismaClients')
const prisma = master

async function main() {
  console.log('Seeding demo items into master (127.0.0.1:3307)')
  await prisma.item.createMany({
    data: [
      { name: 'Apple', price: 10000, stock: 10 },
      { name: 'Banana', price: 5000, stock: 15 }
    ]
  })
  console.log('Seeding finished')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    try { await prisma.$disconnect() } catch (e) {}
  })
