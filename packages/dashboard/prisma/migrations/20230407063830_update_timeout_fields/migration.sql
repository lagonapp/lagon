/*
  Warnings:

  - You are about to drop the column `startupTimeout` on the `Function` table. All the data in the column will be lost.
  - You are about to drop the column `timeout` on the `Function` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Function` DROP COLUMN `startupTimeout`,
    DROP COLUMN `timeout`,
    ADD COLUMN `tickTimeout` INTEGER NOT NULL DEFAULT 200,
    ADD COLUMN `totalTimeout` INTEGER NOT NULL DEFAULT 1000;
