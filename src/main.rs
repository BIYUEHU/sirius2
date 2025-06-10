use roga::*;
use siriusu::utils::{bootstrap_server, get_config, load_env_vars, spawn_bds};
use siriusu_core::{service::logger::get_logger, utils::get_routes};

#[tokio::main]
async fn main() {
    load_env_vars();

    let program_config = match get_config() {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Error: {}", e);
            return;
        }
    };

    let logger = get_logger();
    l_debug!(logger, "Running in development mode");

    if !program_config.bds_directory.is_empty() {
        spawn_bds(&program_config.bds_directory);
    }

    if program_config.server_token.is_empty() {
        l_warn!(logger, "Authentication token is not set");
    }
    if !program_config.safe_path {
        l_warn!(logger, "Safe path is disabled, all files can be accessed")
    }

    let address = format!(
        "{}:{}",
        program_config.server_host, program_config.server_port
    );
    l_info!(logger, "Server running at http://{}", address);

    let routers = get_routes();
    l_debug!(logger, "\n{:?}", routers);

    bootstrap_server(address, routers).await;
}
