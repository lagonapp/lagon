/*
  Warnings:

  - You are about to alter the column `key` on the `EnvVariable` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(64)`.

*/
-- AlterTable
ALTER TABLE `EnvVariable` MODIFY `key` VARCHAR(64) NOT NULL,
    MODIFY `value` VARCHAR(5120) NOT NULL;
