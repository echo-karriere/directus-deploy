# `deploy-website`

This is a small extension that shows the status of the latest production
and development build of our website on our Directus instance. It also allows
us to automatically build a new version using the latest changes from the API
with the press of a single button.

## Usage

First create a file for your environment variables called `.env.local`
containing the following:

```text
SITE_ID=foobar
NETLIFY_KEY=bazqux
```

1. Build for production: `yarn build`
2. Copy to `$DIRECTUS/extensions/custom/modules/deploy-website`
3. ???
4. Profit

## LICENSE

MIT
