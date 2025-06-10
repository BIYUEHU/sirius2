use dotenvy::dotenv;
use roga::*;
use salvo::prelude::*;
use siriusu_common::{constant::CONFIGURATION_FILE_NAME, utils::config::load_config};
use siriusu_core::{
    config::{get_plugin_config, SiriusConfig, CONFIG},
    service::logger::get_logger,
    utils::is_dev_mode,
};
use std::{
    fs,
    io::{self, BufRead, Read, Write},
    path::Path,
    process::{Command, Stdio},
    thread::spawn,
};

pub fn load_env_vars() -> () {
    if is_dev_mode()
        && fs::exists(".env").expect("Cannot load environments variables from .env file.")
    {
        match dotenv() {
            Err(e) => {
                eprintln!("Failed to load environment variables from .env file: {}", e);
                return;
            }
            Ok(_) => {}
        }
    }
}

pub fn get_config() -> Result<SiriusConfig, String> {
    load_config(CONFIGURATION_FILE_NAME)
        .map_err(|e| e.to_string())
        .and_then(|config: SiriusConfig| {
            let mut config = config;
            if is_dev_mode() {
                config.bds_directory = std::env::var("BDS_DIR").unwrap_or(config.bds_directory)
            }

            let log_level = config.log_level.clone();
            let log_level_arr = [
                "fatal", "error", "warn", "info", "record", "debug", "trace", "silent",
            ];
            if log_level_arr.contains(&log_level.as_str()) {
                Ok(CONFIG.get_or_init(|| config).clone())
            } else {
                Err(format!(
                    "Invalid log level: {}. Expected one of: {}",
                    log_level,
                    log_level_arr.join(", ")
                ))
            }
        })
}

pub fn spawn_bds(bds_directory: &String) {
    let logger = get_logger();
    let bds_file = Path::new(bds_directory).join("bedrock_server.exe");

    if !bds_file.exists() {
        l_error!(
            logger,
            "Bedrock server not found at {}",
            bds_file.to_string_lossy()
        );
        return;
    }

    let scripts_dir = Path::new(bds_directory).join("behavior_packs/siriusu/scripts");
    if !scripts_dir.exists() {
        l_error!(
            logger,
            "Cannot find siriusu behavior pack at {}. Do you have install siriusu correctly?"
        );
        return;
    }
    fs::write(scripts_dir.join("config.js"), get_plugin_config())
        .expect("Failed to write config.js");

    let mut child = match Command::new(bds_file)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
    {
        Ok(child) => child,
        Err(e) => {
            l_fatal!(logger, "Failed to start Bedrock server: {}", e);
            return;
        }
    };
    let logger = get_logger().clone().with_label("BDS");
    let mut child_stdin = child
        .stdin
        .take()
        .expect("Failed to get stdin of bds child process");
    let mut child_stdout = child
        .stdout
        .take()
        .expect("Failed to get stdout of bds child process");
    spawn(move || {
        let stdin = io::stdin();
        for line in stdin.lock().lines() {
            if let Ok(input) = line {
                let _ = child_stdin.write_all(input.as_bytes());
                let _ = child_stdin.write_all(b"\n");
            }
        }
    });
    spawn(move || {
        let mut buffer = [0; 1024];
        loop {
            // match child_stdout.read(&mut buffer) {
            //     Ok(0) => break,
            //     Ok(n) => {
            //         let _ = stdout.write("[BDS] ".as_bytes());
            //         let _ = stdout.write_all(&buffer[..n]);
            //         let _ = stdout.flush();
            //     }
            //     Err(_) => break,
            // }
            match child_stdout.read(&mut buffer) {
                Ok(0) => break,
                Ok(n) => {
                    let mut mode = 0;
                    for line in std::str::from_utf8(&buffer[..n]).unwrap_or("").split("\n") {
                        if line.trim().is_empty() {
                            continue;
                        }
                        let arr = line.split(" ERROR]").collect::<Vec<_>>();
                        let arr2 = line.split(" WARN]").collect::<Vec<_>>();
                        let arr3 = line.split(" INFO]").collect::<Vec<_>>();
                        if arr.len() == 2 {
                            l_error!(logger, "{}", arr[1]);
                            mode = 1;
                        } else if arr.len() == 1 && arr2.len() == 2 {
                            l_warn!(logger, "{}", arr2[1]);
                            mode = 2;
                        } else if arr.len() == 1 && arr2.len() == 1 && arr3.len() == 2 {
                            l_info!(logger, "{}", arr3[1]);
                            mode = 3;
                        } else if arr.len() == 1 && arr2.len() == 1 && arr3.len() == 1 {
                            match mode {
                                1 => l_error!(logger, "{}", line),
                                2 => l_warn!(logger, "{}", line),
                                _ => l_info!(logger, "{}", line),
                            }
                        } else {
                            l_info!(logger, "{}", line);
                        }
                    }
                }
                Err(_) => break,
            }
        }
    });
    // spawn(move || {
    //     let reader = BufReader::new(child_stdout);
    //     for line in reader.lines() {
    //         if let Ok(output) = line {
    //             if !output.trim().is_empty() {
    //                 l_info!(logger, "{}", output);
    //             }
    //         }
    //     }
    // });
}

pub async fn bootstrap_server(address: String, routers: Router) {
    Server::new(TcpListener::new(address).bind().await)
        .serve(routers)
        .await
}
