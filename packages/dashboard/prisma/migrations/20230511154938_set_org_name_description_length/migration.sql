/*
  Warnings:

  - You are about to alter the column `name` on the `Function` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(64)`.
  - You are about to alter the column `name` on the `Organization` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(64)`.

*/
-- AlterTable
ALTER TABLE `Function` MODIFY `name` VARCHAR(64) NOT NULL;

-- AlterTable
ALTER TABLE `Organization` MODIFY `name` VARCHAR(64) NOT NULL,
    MODIFY `description` VARCHAR(256) NULL;
