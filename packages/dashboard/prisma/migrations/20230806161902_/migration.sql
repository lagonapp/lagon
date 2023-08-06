/*
  Warnings:

  - You are about to drop the column `platform` on the `Deployment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Deployment` DROP COLUMN `platform`;

-- AlterTable
ALTER TABLE `Function` ADD COLUMN `platform` VARCHAR(191) NOT NULL DEFAULT 'CLI';
