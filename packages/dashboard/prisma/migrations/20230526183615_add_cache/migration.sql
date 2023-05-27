-- CreateTable
CREATE TABLE `CacheStorage` (
    `id` VARCHAR(191) NOT NULL,
    `cacheName` VARCHAR(191) NOT NULL,
    `funcId` VARCHAR(191) NOT NULL,

    INDEX `CacheStorage_funcId_idx`(`funcId`),
    UNIQUE INDEX `CacheStorage_cacheName_funcId_key`(`cacheName`, `funcId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RequestResponseList` (
    `id` VARCHAR(191) NOT NULL,
    `requestUrl` VARCHAR(191) NOT NULL,
    `requestHeaders` BLOB NOT NULL,
    `responseHeaders` BLOB NOT NULL,
    `responseStatus` INTEGER NOT NULL,
    `responseStatusText` TEXT NULL,
    `responseBody` BLOB NULL,
    `cacheId` VARCHAR(191) NOT NULL,
    `lastInsertedAt` DATETIME(3) NOT NULL,

    INDEX `RequestResponseList_cacheId_idx`(`cacheId`),
    UNIQUE INDEX `RequestResponseList_cacheId_requestUrl_key`(`cacheId`, `requestUrl`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
