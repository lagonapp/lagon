use dialoguer::{
    console::{style, Style},
    theme::ColorfulTheme,
};
use indicatif::{ProgressBar, ProgressStyle};
use once_cell::sync::Lazy;
use std::time::Duration;

pub fn print_progress(message: &str) -> impl Fn() + '_ {
    let index_progress = ProgressBar::new_spinner();
    index_progress.set_style(ProgressStyle::default_spinner());
    index_progress.set_message(
        style(format!("{}...", message))
            .black()
            .bright()
            .to_string(),
    );
    index_progress.tick();

    let handle = index_progress.clone();

    tokio::task::spawn(async move {
        loop {
            if handle.is_finished() {
                break;
            }

            handle.tick();
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    });

    move || {
        index_progress.finish_and_clear();
        println!("{} {}", style("✓").green(), style(message).black().bright());
    }
}

pub static THEME: Lazy<ColorfulTheme> = Lazy::new(|| ColorfulTheme {
    defaults_style: Style::new().for_stderr().blue(),
    prompt_style: Style::new().for_stderr().bold(),
    prompt_prefix: style(" ○".to_string()).for_stderr().magenta(),
    prompt_suffix: style("›".to_string()).for_stderr().black().bright(),
    success_prefix: style(" ●".to_string()).for_stderr().magenta(),
    success_suffix: style("›".to_string()).for_stderr().black().bright(),
    error_prefix: style("✕".to_string()).for_stderr().red(),
    error_style: Style::new().for_stderr(),
    hint_style: Style::new().for_stderr().black().bright(),
    values_style: Style::new().for_stderr().blue(),
    active_item_style: Style::new().for_stderr().blue(),
    inactive_item_style: Style::new().for_stderr(),
    active_item_prefix: style("›".to_string()).for_stderr().blue(),
    inactive_item_prefix: style(" ".to_string()).for_stderr(),
    checked_item_prefix: style("✔".to_string()).for_stderr().green(),
    unchecked_item_prefix: style("✔".to_string()).for_stderr().black(),
    picked_item_prefix: style("❯".to_string()).for_stderr().green(),
    unpicked_item_prefix: style(" ".to_string()).for_stderr(),
    inline_selections: true,
});
