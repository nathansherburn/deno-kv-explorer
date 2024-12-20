# deno-kv-explorer
A simple app for browsing your Deno KV data.

## Features
* No build step
* Zero dependencies
* Server is less than 100 lines of code
* Easy to modify to your needs

## Setup
1. Rename `example.env` to `.env`
2. Grab your Deno KV database ID from `https://dash.deno.com/projects/<your-project-name>/kv`
3. Replace the dummy value for `DENO_KV_DB_ID` with your actual database ID
4. Create an access token from `https://dash.deno.com/account`
5. Replace the dummy value for `DENO_KV_ACCESS_TOKEN` with your access token
6. Run `deno run start` and go to `localhost:8000` in your browser