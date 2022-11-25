/*
  Warnings:

  - You are about to drop the column `receiveBytes` on the `Stat` table. All the data in the column will be lost.
  - Added the required column `receivedBytes` to the `Stat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Stat` DROP COLUMN `receiveBytes`,
    ADD COLUMN `receivedBytes` INTEGER NOT NULL;
