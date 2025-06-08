use salvo::prelude::*;
use sirisu::prelude::*;

#[tokio::main]
async fn main() {
    let router = Router::with_path("io")
        .push(
            Router::with_path("file/{path}")
                .get(read_file)
                .put(write_file)
                .delete(delete_file),
        )
        .push(Router::with_path("exists/{path}").get(exists))
        .push(Router::with_path("isFile/{path}").get(is_file))
        .push(Router::with_path("isDir/{path}").get(is_directory))
        .push(Router::with_path("mkdir/{path}").post(create_directory))
        .push(Router::with_path("list/{path}").get(list_directory))
        .push(Router::with_path("rmdir/{path}").delete(delete_directory))
        .push(Router::with_path("copy").post(copy_file))
        .push(Router::with_path("resolve/{path}").get(resolve_path));

    println!("Server running at http://localhost:3000");
    println!("{:?}", router);

    Server::new(TcpListener::new("127.0.0.1:3000").bind().await)
        .serve(router)
        .await;
}
