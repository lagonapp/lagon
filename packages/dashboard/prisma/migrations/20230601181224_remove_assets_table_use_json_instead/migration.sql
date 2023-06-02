/*
  Warnings:

  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `assets` to the `Deployment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Deployment` ADD COLUMN `assets` JSON NOT NULL;

-- Migrate Asset rows to Deployment's assets column
UPDATE
	Deployment AS deployment
	INNER JOIN (
		SELECT
			JSON_ARRAYAGG(name) AS assets,
			deploymentId
		FROM
			Asset
		GROUP BY
			deploymentId) AS res SET deployment.assets = res.assets
WHERE
	deployment.id = res.deploymentId

-- DropTable
DROP TABLE `Asset`;
