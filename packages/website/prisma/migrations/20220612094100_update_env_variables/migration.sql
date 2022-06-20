/*
  Warnings:

  - You are about to drop the `EnvironmentVariables` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EnvironmentVariables" DROP CONSTRAINT "EnvironmentVariables_functionId_fkey";

-- AlterTable
ALTER TABLE "Function" ADD COLUMN     "env" TEXT;

-- DropTable
DROP TABLE "EnvironmentVariables";
