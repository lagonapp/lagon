import { bundleFunction, CONFIG_DIRECTORY } from '../utils/deployments';
import { logInfo, logSpace, logDeploymentSuccessful, logWarn, logSuccess } from '../utils/logger';
import { getAssetsDir, getClientFile, getFileToDeploy } from '../utils';
import fs from 'node:fs';
import path from 'node:path';

export async function build(
  file: string,
  { preact, client, publicDir, force }: { preact: boolean; client: string; publicDir: string; force: boolean },
) {
  const fileToDeploy = getFileToDeploy(file);

  if (!fileToDeploy) {
    return;
  }

  const assetsDir = getAssetsDir(fileToDeploy, publicDir);

  if (!assetsDir) {
    return;
  }

  let clientFile: string | undefined;

  if (client || preact) {
    if (preact) {
      logWarn("'--preact' is deprecated, use '--client <file>' instead.");
    }

    clientFile = getClientFile(fileToDeploy, preact ? 'App.tsx' : client);

    if (!clientFile) {
      return;
    }
  }

  const { code, assets } = await bundleFunction({
    file: fileToDeploy,
    clientFile,
    assetsDir,
  });

  logSpace();
  logInfo('Writting index.js...');

  if (!fs.existsSync(CONFIG_DIRECTORY)) {
    fs.mkdirSync(CONFIG_DIRECTORY);
  }

  fs.writeFileSync(path.join(CONFIG_DIRECTORY, 'index.js'), code);

  assets.forEach(({ name, content }) => {
    logInfo(`Writting ${name}...`);

    const file = path.join(CONFIG_DIRECTORY, name);

    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  });

  logSpace();
  logSuccess(`Build successful! You can find it in .lagon (${CONFIG_DIRECTORY})`);
  logSpace();
}
