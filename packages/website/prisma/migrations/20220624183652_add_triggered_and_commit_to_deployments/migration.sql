-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "commit" TEXT,
ADD COLUMN     "triggerer" TEXT NOT NULL DEFAULT E'Lagon';
