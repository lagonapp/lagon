/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Function` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Function_name_key" ON "Function"("name");
