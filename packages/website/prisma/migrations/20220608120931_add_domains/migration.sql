/*
  Warnings:

  - You are about to drop the column `hostname` on the `Function` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Function" DROP COLUMN "hostname",
ADD COLUMN     "domains" TEXT[];
