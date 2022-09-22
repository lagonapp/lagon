use colored::Colorize;
use indicatif::{ProgressBar, ProgressStyle};

pub fn info(message: &str) -> String {
    format!("{} {}", "?".blue(), message)
}

pub fn input(message: &str) -> String {
    format!(" {} {}", "↳".black(), message.black())
}

pub fn debug(message: &str) -> String {
    message.black().to_string()
}

pub fn debug_success(message: &str) -> String {
    format!("{} {}", "✓".green(), message.black())
}

pub fn success(message: &str) -> String {
    format!("{} {}", "✓".green(), message)
}

pub fn error(message: &str) -> String {
    format!("{} {}", "✖".red(), message)
}

pub fn print_progress(message: &str) -> impl Fn() + '_ {
    let index_progress = ProgressBar::new_spinner();
    index_progress.set_style(ProgressStyle::default_spinner());
    index_progress.set_message(debug(message));

    move || {
        index_progress.finish_and_clear();
        println!("{}", debug_success(message));
    }
}
