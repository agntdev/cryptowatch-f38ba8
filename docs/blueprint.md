# CryptoWatch — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A private Telegram bot that watches crypto prices for each user, sends alerts when coins hit price thresholds or move by a percentage over time, and offers on-demand price checks and a morning summary.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- crypto traders
- crypto enthusiasts
- retail investors

## Success criteria

- user can add a coin to their watchlist
- user receives an alert when a coin hits their price threshold
- user receives an alert when a coin moves by their percentage threshold
- user can check current prices on demand
- user receives a daily morning summary
- user can set quiet hours to suppress alerts
- user can set a custom summary time
- user can retry failed price fetches
- user can view their current settings

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu
- **/add** (command, actor: user, command: /add) — Add a coin to the watchlist
- **/remove** (command, actor: user, command: /remove) — Remove a coin from the watchlist
- **/price** (command, actor: user, command: /price) — Show current price for one coin or all coins on the watchlist
- **/setthreshold** (command, actor: user, command: /setthreshold) — Set a price threshold alert for a coin
- **/setpercent** (command, actor: user, command: /setpercent) — Set a percentage-change alert for a coin
- **/quiet** (command, actor: user, command: /quiet) — Set quiet hours
- **/summary** (command, actor: user, command: /summary) — Set the time for the daily morning summary
- **/settings** (command, actor: user, command: /settings) — Show current alert settings and quiet hours
- **/help** (command, actor: user, command: /help) — Show available commands

## Flows

### add coin
_Trigger:_ /add <ticker>

1. Parse ticker from command
2. Validate ticker
3. Fetch current price
4. Add coin to watchlist
5. Store last known price
6. Reply with success message

_Data touched:_ user, watchlist item, price

### remove coin
_Trigger:_ /remove <ticker>

1. Parse ticker from command
2. Validate ticker
3. Remove coin from watchlist
4. Reply with success message

_Data touched:_ user, watchlist item

### check price
_Trigger:_ /price <ticker>

1. Parse ticker from command
2. Validate ticker
3. Fetch current price
4. Reply with current price
5. Store last known price

_Data touched:_ user, price

### check all prices
_Trigger:_ /price

1. Fetch current price for all coins on watchlist
2. Reply with all prices
3. Store last known price for each coin

_Data touched:_ user, price

### set price threshold
_Trigger:_ /setthreshold <ticker> <price>

1. Parse ticker and price from command
2. Validate ticker and price
3. Set price threshold for coin
4. Reply with success message

_Data touched:_ user, watchlist item

### set percentage threshold
_Trigger:_ /setpercent <ticker> <percent>

1. Parse ticker and percent from command
2. Validate ticker and percent
3. Set percentage-change threshold for coin
4. Reply with success message

_Data touched:_ user, watchlist item

### set quiet hours
_Trigger:_ /quiet <start> <end>

1. Parse start and end times from command
2. Validate times
3. Set quiet hours for user
4. Reply with success message

_Data touched:_ user

### set summary time
_Trigger:_ /summary <time>

1. Parse time from command
2. Validate time
3. Set summary time for user
4. Reply with success message

_Data touched:_ user

### show settings
_Trigger:_ /settings

1. Fetch user settings
2. Reply with settings

_Data touched:_ user

### show help
_Trigger:_ /help

1. Reply with help message

### send alert
_Trigger:_ price threshold or percentage-change threshold reached

1. Check if user is in quiet hours
2. Check cooldown state
3. Fetch current price
4. Calculate percent change
5. Send alert message
6. Update cooldown state
7. Update last known price

_Data touched:_ user, alert, watchlist item, price

### send daily summary
_Trigger:_ daily summary time reached

1. Fetch user settings
2. Fetch current price for all coins on watchlist
3. Calculate percent changes
4. Send summary message
5. Update last known price for each coin
6. Update summary timestamp

_Data touched:_ user, summary, watchlist item, price

### retry failed price fetch
_Trigger:_ price fetch fails

1. Check retry count
2. Wait with exponential backoff
3. Retry fetch
4. Update retry count
5. Give up if retries exhausted

_Data touched:_ user, price

### handle unknown ticker
_Trigger:_ user enters unknown ticker

1. Reply with helpful message
2. Suggest common tickers or ask user to verify

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **user** _(retention: persistent)_ — Telegram user with their own watchlist, alert settings, quiet hours, cooldown state, and summary preferences.
  - fields: telegram_id, watchlist, price_threshold, percent_threshold, quiet_hours_start, quiet_hours_end, summary_time, cooldown_state, last_known_price, summary_timestamp
- **watchlist item** _(retention: persistent)_ — A coin ticker with a user-defined price threshold and percentage-change threshold.
  - fields: ticker, price_threshold, percent_threshold
- **alert** _(retention: none)_ — A triggered condition with the coin, old/new price, and percent change.
  - fields: ticker, old_price, new_price, percent_change, timestamp
- **summary** _(retention: none)_ — A daily morning report of price changes for the user's watchlist.
  - fields: timestamp, price_changes

## Integrations

- **Telegram** (required) — Bot API messaging
- **CoinGecko API** (required) — Fetch current crypto prices
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- add coin to watchlist
- remove coin from watchlist
- set price threshold
- set percentage-change threshold
- set quiet hours
- set summary time
- view settings
- view help

## Notifications

- alert when price threshold reached
- alert when percentage-change threshold reached
- daily summary at user's configured time

## Permissions & privacy

- user watchlist is private
- user alert settings are private
- user quiet hours are private
- user cooldown state is private
- user last known price is private
- user summary timestamps are private
- no user data is shared with third parties

## Edge cases

- unknown ticker
- price fetch fails
- user in quiet hours
- cooldown period active
- invalid command format
- invalid ticker format
- invalid price format
- invalid percent format
- invalid time format
- invalid quiet hours format
- invalid summary time format

## Required tests

- dialog-level acceptance test for /start
- dialog-level acceptance test for /add
- dialog-level acceptance test for /remove
- dialog-level acceptance test for /price
- dialog-level acceptance test for /setthreshold
- dialog-level acceptance test for /setpercent
- dialog-level acceptance test for /quiet
- dialog-level acceptance test for /summary
- dialog-level acceptance test for /settings
- dialog-level acceptance test for /help
- dialog-level acceptance test for alert when price threshold reached
- dialog-level acceptance test for alert when percentage-change threshold reached
- dialog-level acceptance test for daily summary
- dialog-level acceptance test for retry failed price fetch
- dialog-level acceptance test for handle unknown ticker

## Assumptions

- price feed uses CoinGecko API
- alert cooldown is 1 hour
- quiet hours default is 22:00-08:00
- summary time default is 09:00
- percentage-change window is 1 hour
- retry logic has 3 retries with exponential backoff
- unknown ticker handling suggests common tickers or asks user to verify
