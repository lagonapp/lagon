import { program } from 'commander';
import { version } from '../package.json';
import { loggedInGuard } from './auth';
import { deploy } from './commands/deploy';
import { dev } from './commands/dev';
import { login } from './commands/login';
import { logout } from './commands/logout';
import { undeploy } from './commands/undeploy';

export function runCli() {
  program.name('lagon').description('Deploy Serverless Functions at the Edge').version(version);
  program.command('login').description('Login to Lagon').action(login);
  program.command('logout').description('Logout from Lagon').action(logout);
  program
    .command('deploy')
    .description('Deploy the given file')
    .argument('<file>', 'The file to deploy')
    .option('--preact', 'Bundle the function as a preact site')
    .option('-p, --public-dir <dir>', 'The directory to serve the public assets from', 'public')
    .action(loggedInGuard(deploy));
  program
    .command('remove')
    .alias('rm')
    .description('Undeploy the given file')
    .argument('<file>', 'The file unto deploy')
    .action(loggedInGuard(undeploy));
  program
    .command('dev')
    .description('Launch a local dev server')
    .argument('<file>', 'The file to serve')
    .option('--preact', 'Bundle the function as a preact site')
    .option('-p, --public-dir <dir>', 'The directory to serve the public assets from', 'public')
    .action(dev);

  program.parse();
}
