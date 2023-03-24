use std::path::PathBuf;

use clap::{Parser, Subcommand};
use serde::Deserialize;

use crate::utils::error;

mod commands;
mod utils;

static PACKAGE_JSON: &str = include_str!("../package.json");

#[derive(Deserialize)]
struct PackageJson {
    version: String,
}

#[derive(Parser, Debug)]
#[command(author, about, long_about = None, arg_required_else_help = true)]
struct Cli {
    #[clap(subcommand)]
    command: Option<Commands>,
    /// Print version information
    #[clap(short, long)]
    version: bool,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Log in to Lagon
    Login,
    /// Log out of Lagon
    Logout,
    /// Deploy a new or existing Function
    Deploy {
        /// Path to a file or a directory containing a Function
        #[clap(value_parser)]
        path: Option<PathBuf>,
        /// Path to a client-side script
        #[clap(short, long, value_parser)]
        client: Option<PathBuf>,
        /// Path to a public directory to serve assets from
        #[clap(short, long, value_parser)]
        public_dir: Option<PathBuf>,
        /// Deploy as a production deployment
        #[clap(visible_alias = "production", long)]
        prod: bool,
    },
    /// Delete an existing Function
    Rm {
        /// Path to a directory containing a Function
        #[clap(value_parser)]
        directory: Option<PathBuf>,
    },
    /// Start a local dev server to test a Functon
    Dev {
        /// Path to a file or a directory containing a Function
        #[clap(value_parser)]
        path: Option<PathBuf>,
        /// Path to a client-side script
        #[clap(short, long, value_parser)]
        client: Option<PathBuf>,
        /// Path to a public directory to serve assets from
        #[clap(short, long, value_parser)]
        public_dir: Option<PathBuf>,
        /// Port to start dev server on
        #[clap(long)]
        port: Option<u16>,
        /// Hostname to start dev server on
        #[clap(long)]
        hostname: Option<String>,
        /// Path to a env file to parse
        #[clap(short, long, value_parser)]
        env: Option<PathBuf>,
        /// Allow code generation from strings using `eval` / `new Function`
        #[clap(long)]
        allow_code_generation: bool,
    },
    /// Build a Function without deploying it
    Build {
        /// Path to a file or a directory containing a Function
        #[clap(value_parser)]
        path: Option<PathBuf>,
        /// Path to a client-side script
        #[clap(short, long, value_parser)]
        client: Option<PathBuf>,
        /// Path to a public directory to serve assets from
        #[clap(short, long, value_parser)]
        public_dir: Option<PathBuf>,
    },
    /// Link a local Function file to an already deployed Function
    Link {
        /// Path to a directory containing a Function
        #[clap(value_parser)]
        directory: Option<PathBuf>,
    },
    /// List all the Deployments for a Function
    Ls {
        /// Path to a directory containing a Function
        #[clap(value_parser)]
        directory: Option<PathBuf>,
    },
    /// Undeploy the given Deployment
    Undeploy {
        /// ID of the Deployment to undeploy
        deployment_id: String,
        /// Path to a directory containing a Function
        #[clap(value_parser)]
        directory: Option<PathBuf>,
    },
    /// Promote the given preview Deployment to production
    Promote {
        /// ID of the Deployment to promote
        deployment_id: String,
        /// Path to a directory containing a Function
        #[clap(value_parser)]
        directory: Option<PathBuf>,
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
                path,
                client,
                public_dir,
                prod,
            } => commands::deploy(path, client, public_dir, prod).await,
            Commands::Rm { directory } => commands::rm(directory).await,
            Commands::Dev {
                path,
                client,
                public_dir,
                port,
                hostname,
                env,
                allow_code_generation,
            } => {
                commands::dev(
                    path,
                    client,
                    public_dir,
                    port,
                    hostname,
                    env,
                    allow_code_generation,
                )
                .await
            }
            Commands::Build {
                path,
                client,
                public_dir,
            } => commands::build(path, client, public_dir),
            Commands::Link { directory } => commands::link(directory).await,
            Commands::Ls { directory } => commands::ls(directory).await,
            Commands::Undeploy {
                deployment_id,
                directory,
            } => commands::undeploy(deployment_id, directory).await,
            Commands::Promote {
                deployment_id,
                directory,
            } => commands::promote(deployment_id, directory).await,
        } {
            println!("{}", error(&err.to_string()));
        }
    } else {
        match serde_json::from_str(PACKAGE_JSON) {
            Ok(PackageJson { version }) => {
                println!("{version}");
            }
            _ => println!("{}", error("Couldn't extract version from package.json")),
        }
    }
}
