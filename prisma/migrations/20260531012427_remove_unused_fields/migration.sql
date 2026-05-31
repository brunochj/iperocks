/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `blocks` table. All the data in the column will be lost.
  - You are about to drop the column `isClosed` on the `lines` table. All the data in the column will be lost.
  - You are about to drop the column `isProject` on the `lines` table. All the data in the column will be lost.
  - You are about to drop the column `stars` on the `lines` table. All the data in the column will be lost.
  - You are about to drop the column `topoImage` on the `lines` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `sectors` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('NEST', 'BROKEN_HOLD', 'FALL_RISK', 'NO_ACCESS');

-- DropIndex
DROP INDEX "ascents_userId_idx";

-- AlterTable
ALTER TABLE "blocks" DROP COLUMN "imageUrl";

-- AlterTable
ALTER TABLE "lines" DROP COLUMN "isClosed",
DROP COLUMN "isProject",
DROP COLUMN "stars",
DROP COLUMN "topoImage",
ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sectors" DROP COLUMN "imageUrl";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "description" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_lineId_key" ON "reviews"("userId", "lineId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
