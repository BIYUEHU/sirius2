use std::{
    fs,
    path::{Path, PathBuf},
    pin::Pin,
};

pub fn safe_path_guard(path_str: &str) -> Result<PathBuf, String> {
    let path = Path::new(path_str);
    path.canonicalize()
        .map_err(|e| format!("Invalid path: {}", e))
        .and_then(|p| {
            if p.starts_with(std::env::current_dir().unwrap_or_default()) {
                Ok(p)
            } else {
                Err("Path outside working directory".to_string())
            }
        })
}

pub fn copy_recursive<'a>(
    src: &'a Path,
    dest: &'a Path,
) -> Pin<Box<dyn Future<Output = Result<(), String>> + 'a>> {
    Box::pin(async move {
        let metadata =
            fs::metadata(src).map_err(|e| format!("Failed to read source metadata: {}", e))?;

        if metadata.is_file() {
            if let Some(parent) = dest.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create destination parent directory: {}", e))?;
            }

            fs::copy(src, dest)
                .map(|_| ())
                .map_err(|e| format!("Failed to copy file: {}", e))
        } else if metadata.is_dir() {
            fs::create_dir_all(dest)
                .map_err(|e| format!("Failed to create destination directory: {}", e))?;

            let entries =
                fs::read_dir(src).map_err(|e| format!("Failed to read source directory: {}", e))?;

            for entry_result in entries {
                let entry =
                    entry_result.map_err(|e| format!("Failed to read directory entry: {}", e))?;
                let src_child = entry.path();
                let dest_child = dest.join(entry.file_name());

                // Recursive async call
                copy_recursive(&src_child, &dest_child).await?;
            }

            Ok(())
        } else {
            Err("Source is neither file nor directory".to_string())
        }
    })
}
