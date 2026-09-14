# Page View Tracking

This folder contains a small AWS API for the article site's page-view events.

## Flow

1. The Angular app creates a new `visit_id` each time the browser reloads the site.
2. Initial load and every Angular route change sends a `POST` request to API Gateway.
3. Lambda enriches the event with server-side request data such as source IP, user agent, and any available geo headers.
4. Lambda inserts a new DynamoDB item for every page view.

The UI sends only page context. The Lambda owns IP capture and marks configured owner IPs as `x.x.x.x (owner)` in the `src` field.

## Deploy

```sh
sam build --template-file aws/page-view-tracking/template.yaml
sam deploy --guided
```

Use these deploy values:

- `AllowedOrigin`: `https://gopalcb.github.io`
- `OwnerIps`: your current public IP address, or a comma-separated list of owner IPs

After deploy, copy the `PageViewEndpoint` output into `public/runtime-config.js`:

```js
window.AGENT_SYSTEMS_PAGE_VIEW_ENDPOINT = "https://example.execute-api.us-east-1.amazonaws.com/agent/page-view";
```

Then run `npm run build:pages` and publish the updated `docs/` folder.

## DynamoDB Item

Each row is inserted with a unique `view_id` and includes:

- `visit_id`
- `page_link`
- `route`
- `page_title`
- `site`
- `event_timestamp`
- `stored_at`
- `country`
- `city`
- `src`
- `user_agent`
