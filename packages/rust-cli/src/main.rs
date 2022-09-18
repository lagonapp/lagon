use std::path::PathBuf;

use clap::{Parser, Subcommand};

mod commands;

#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Cli {
    #[clap(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Log in to Lagon
    Login,
    /// Log out of Lagon
    Logout,
    /// Deploy a new or existing Function
    Deploy {
        /// Path to the file to deploy
        #[clap(value_parser)]
        file: PathBuf,
        /// Path to a client-side script
        #[clap(short, long, value_parser)]
        client: Option<PathBuf>,
        /// Path to the public directory to serve assets from
        #[clap(short, long, value_parser)]
        public_dir: Option<PathBuf>,
        /// Force the creation of a new Function
        #[clap(short, long)]
        force: bool,
    },
    /// Undeploy an existing Function
    Undeploy {
        /// Path to the file to undeploy
        #[clap(value_parser)]
        file: PathBuf,
    },
    /// Start a local dev server to test a Functon
    Dev {
        /// Path to the file to run
        #[clap(value_parser)]
        file: PathBuf,
        /// Path to a client-side script
        #[clap(short, long, value_parser)]
        client: Option<PathBuf>,
        /// Path to the public directory to serve assets from
        #[clap(short, long, value_parser)]
        public_dir: Option<PathBuf>,
        /// Port to start dev server on
        #[clap(long)]
        port: Option<u16>,
        /// Hostname to start dev server on
        #[clap(long)]
        hostname: Option<String>,
    },
    /// Build a Function without deploying it
    Build {
        /// Path to the file to build
        #[clap(value_parser)]
        file: PathBuf,
        /// Path to a client-side script
        #[clap(short, long, value_parser)]
        client: Option<PathBuf>,
        /// Path to the public directory to serve assets from
        #[clap(short, long, value_parser)]
        public_dir: Option<PathBuf>,
    },
}

fn main() {
    let args = Cli::parse();

    if let Some(command) = args.command {
        match command {
            Commands::Login => commands::login(),
            Commands::Logout => commands::logout(),
            Commands::Deploy { file, client, public_dir, force } => commands::deploy(file, client, public_dir, force),
            Commands::Undeploy { file } => commands::undeploy(file),
            Commands::Dev { file, client, public_dir, port, hostname } => commands::dev(file, client, public_dir, port, hostname),
            Commands::Build { file, client, public_dir } => commands::build(file, client, public_dir),
            _ => {}
        };
    }
}