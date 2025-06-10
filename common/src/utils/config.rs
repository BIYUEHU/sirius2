use anyhow::{Context, Result};
use config::{Config, File, FileFormat};
use serde::{Deserialize, Serialize};
use std::env;

pub fn load_config<'a, C>(name: &str) -> Result<C>
where
    C: Serialize + Deserialize<'a>,
{
    let current_dir = env::current_dir().context("Failed to get current directory")?;
    let config: C = Config::builder()
        .add_source(File::new(
            current_dir
                .join(name)
                .to_str()
                .expect("Failed to convert current directory path to string"),
            FileFormat::Toml,
        ))
        .build()
        .map_err(|e| {
            anyhow::anyhow!(
                "Cannot find {} at current directory: {}, error: {}",
                name,
                current_dir.display(),
                e
            )
        })?
        .try_deserialize()
        .map_err(|e| anyhow::anyhow!("Failed to deserialize config: {}", e,))?;
    Ok(config)
}
