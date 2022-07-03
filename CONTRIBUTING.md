# Contributing

Thanks for wanting to contribute to this project! You'll find below some guides on how you can contribute.

## Found a bug?

Please open an [issue](https://github.com/lagonapp/lagon/issues/new) and fill in the "Bug report" template.

## Coding guidelines

- Commits are following the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) convention.

- We use ESLint and Prettier to format our code, which should be handled automatically by most editors. If this is not the case, you can run the `lint` script.

- Make sure to add a test when adding new features / fixing bugs, so we can prevent any other future bug.

### Requirements

You'll need [Node.js](https://nodejs.org/en/) >= 16 and [PNPM](https://pnpm.io/) >= 7.3.0 (as of writing).

We also use the amazing [isolated-vm](https://github.com/laverdet/isolated-vm) package, which has additional requirements:
> Furthermore, to install this module you will need a compiler installed. If you run into errors while running npm install isolated-vm it is likely you don't have a compiler set up, or your compiler is too old.
>
> - Windows + OS X users should follow the instructions here: node-gyp
> - Ubuntu users should run: `sudo apt-get install python g++ build-essential`
> - Alpine users should run: `sudo apk add python make g++`
> - Amazon Linux AMI users should run: `sudo yum install gcc72 gcc72-c++`
> - Arch Linux users should run: `sudo pacman -S make gcc python`

Thanks a lot!
