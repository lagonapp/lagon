-- DropForeignKey
ALTER TABLE "Deployment" DROP CONSTRAINT "Deployment_functionId_fkey";

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "Function"("id") ON DELETE CASCADE ON UPDATE CASCADE;
