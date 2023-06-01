/*
  Warnings:

  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `assets` to the `Deployment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Deployment` ADD COLUMN `assets` JSON NOT NULL;

-- DropTable
DROP TABLE `Asset`;
