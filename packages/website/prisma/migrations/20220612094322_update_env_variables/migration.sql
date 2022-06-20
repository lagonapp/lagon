/*
  Warnings:

  - The `env` column on the `Function` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Function" DROP COLUMN "env",
ADD COLUMN     "env" TEXT[];
