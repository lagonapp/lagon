-- CreateTable
CREATE TABLE `Stat` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `functionId` VARCHAR(191) NOT NULL,
    `deploymentId` VARCHAR(191) NOT NULL,
    `cpuTime` INTEGER NOT NULL,
    `memory` INTEGER NOT NULL,
    `sendBytes` INTEGER NOT NULL,
    `receiveBytes` INTEGER NOT NULL,
    `requests` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Log` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `functionId` VARCHAR(191) NOT NULL,
    `deploymentId` VARCHAR(191) NOT NULL,
    `level` ENUM('LOG', 'ERROR', 'INFO', 'WARN', 'DEBUG') NOT NULL,
    `message` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
