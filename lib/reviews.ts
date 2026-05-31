// lib/reviews.ts
import { prisma } from './prisma'

export async function getLineAverageRating(lineId: string): Promise<number> {
  const result = await prisma.review.aggregate({
    where: { lineId },
    _avg: { rating: true },
  })
  return result._avg.rating ?? 0
}