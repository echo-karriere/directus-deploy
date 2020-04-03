# `directus-deploy`

This is a small extension that shows the status of the latest production
and development build of our website on our Directus instance. It also allows
us to automatically build a new version using the latest changes from the API
with the press of a single button.

## Usage

First create a file for your environment variables called `.env.local`
containing the following variables that you find on your Netlify
dashboard/settings:

```text
SITE_ID=foobar
NETLIFY_KEY=bazqux
PROD_HOOK=abcdef123
DEV_HOOK=abcdef123
```

Note that for the key and hooks you have to create them yourself.

1. Build for production: `yarn build`
2. Copy to `$DIRECTUS/extensions/custom/modules/directus-deploy`
3. ???
4. Profit

## LICENSE

MIT
