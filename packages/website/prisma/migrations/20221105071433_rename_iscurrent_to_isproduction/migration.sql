/*
  Warnings:

  - You are about to drop the column `isCurrent` on the `Deployment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Deployment` DROP COLUMN `isCurrent`,
    ADD COLUMN `isProduction` BOOLEAN NOT NULL DEFAULT false;
