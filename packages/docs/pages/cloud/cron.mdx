Instead of providing an HTTP endpoint, you can create a [Cron expression](https://en.wikipedia.org/wiki/Cron) to automatically execute your Function at the given interval.

## How it works

Cron Functions work the same as normal Functions, except that:

- Function's `Request` is always empty, meaning the body, URL, and headers are empty
- If the Function's `Response` returns a `200` status code, Lagon will log a success message, optionally logging the `body` if it isn't empty.
- If the Function's `Response` returns a non-`200` status code, Lagon will log an error message optionally logging the `body` if it isn't empty, and retry the execution later.
- **Only production deployment are executed**

Additionally, Cron Functions aren't accessible via HTTP, either using the default URL or a custom domain. The overview page of a Cron Function is a bit different than an HTTP Function, and shows more information like the time of the last and the next Cron executions.

## Configuration

Head over to the settings tab of your Function in the [Dashboard](https://dash.lagon.app) and scroll to the Cron section. Here, you can configure the Cron expression, which will be empty by default. We recommend using a tool like [Crontab Guru](https://crontab.guru/) to generate Cron expressions:

![Cron](/images/cron.png)

Lagon accepts Cron expressions in the following format:

```
 ┌───────────── minute (0 - 59)
 │ ┌───────────── hour (0 - 23)
 │ │ ┌───────────── day of month (1 - 31)
 │ │ │ ┌───────────── month (1 - 12, Jan - Dec)
 │ │ │ │ ┌───────────── day of week (0 - 6, Mon - Sun)
 │ │ │ │ │
 * * * * *
 
 */5 * * * *            Run every 5 minutes
 
 0 12 * * *             Run every day at 12:00
 
 0 12,18 * * *          Run every day at 12:00 and 18:00
 
 0 6 * * 1              Run every Monday at 06:00
 0 6 * * Mon            Run every Monday at 06:00
```

You can then click "Update" and your Function will be automatically executed at the given interval. Cron Functions only run in a single [region](/cloud/regions). You can select your preferred region:

![Cron region](/images/cron-region.png)

## Disabling

To disable the Cron configuration, simply remove the Cron expression and click "Update".
