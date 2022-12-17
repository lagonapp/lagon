-- CreateIndex
CREATE INDEX `Account_userId_idx` ON `Account`(`userId`);

-- CreateIndex
CREATE INDEX `Asset_deploymentId_idx` ON `Asset`(`deploymentId`);

-- CreateIndex
CREATE INDEX `Deployment_functionId_idx` ON `Deployment`(`functionId`);

-- CreateIndex
CREATE INDEX `Domain_functionId_idx` ON `Domain`(`functionId`);

-- CreateIndex
CREATE INDEX `EnvVariable_functionId_idx` ON `EnvVariable`(`functionId`);

-- CreateIndex
CREATE INDEX `Function_organizationId_idx` ON `Function`(`organizationId`);

-- CreateIndex
CREATE INDEX `Organization_ownerId_idx` ON `Organization`(`ownerId`);

-- CreateIndex
CREATE INDEX `Session_userId_idx` ON `Session`(`userId`);

-- CreateIndex
CREATE INDEX `Token_userId_idx` ON `Token`(`userId`);
