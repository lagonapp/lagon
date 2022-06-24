/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Token` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_organizationId_fkey";

-- AlterTable
ALTER TABLE "Token" DROP COLUMN "organizationId";
