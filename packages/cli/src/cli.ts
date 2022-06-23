import { program } from 'commander';
import { version } from '../package.json';
import { login } from './commands/login';
import { logout } from './commands/logout';

export function runCli() {
  program.name('lagon').description('Deploy Serverless Functions at the Edge').version(version);
  program.command('login').description('Login to Lagon').action(login);
  program.command('logout').description('Logout from Lagon').action(logout);
  program
    .command('deploy')
    .description('Deploy the given directory')
    .argument('[directory]', 'The directory to deploy', '.')
    .option('-p, --prod', 'Deploy to production', false)
    .action((directory, { prod }: { prod: boolean }) => {
      console.log('Deploy', directory, prod);
    });
  program
    .command('remove')
    .alias('rm')
    .description('Undeploy the given directory')
    .argument('[directory]', 'The directory to deploy', '.')
    .action(directory => {
      console.log('Undeploy', directory);
    });

  program.parse();
}
