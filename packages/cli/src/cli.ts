import { program } from 'commander';
import { version } from '../package.json';
import { deploy } from './commands/deploy';
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
    .action(deploy);
  program
    .command('remove')
    .alias('rm')
    .description('Undeploy the given file')
    .argument('<file>', 'The file unto deploy')
    .action(undeploy);

  program.parse();
}
