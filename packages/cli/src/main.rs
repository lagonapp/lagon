use std::path::PathBuf;

use clap::{Parser, Subcommand};

use crate::utils::error;

mod commands;
mod utils;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None, arg_required_else_help = true)]
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

#[tokio::main]
async fn main() {
    let args = Cli::parse();

    if let Some(command) = args.command {
        if let Err(err) = match command {
            Commands::Login => commands::login().await,
            Commands::Logout => commands::logout(),
            Commands::Deploy {
                file,
                client,
                public_dir,
                force,
            } => commands::deploy(file, client, public_dir, force).await,
            Commands::Undeploy { file } => commands::undeploy(file).await,
            Commands::Dev {
                file,
                client,
                public_dir,
                port,
                hostname,
            } => commands::dev(file, client, public_dir, port, hostname).await,
            Commands::Build {
                file,
                client,
                public_dir,
            } => commands::build(file, client, public_dir),
        } {
            println!("{}", error(&err.to_string()));
        }
    }
}
