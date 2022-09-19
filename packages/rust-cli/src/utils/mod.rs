#[cfg(debug_assertions)]
pub fn get_site_url() -> String {
    "http://localhost:3000".to_string()
}

#[cfg(not(debug_assertions))]
pub fn get_site_url() -> String {
    "https://dash.lagon.app".to_string()
}

pub fn get_cli_url() -> String {
    get_site_url() + "/cli"
}
