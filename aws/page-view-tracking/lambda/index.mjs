import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLE_NAME = process.env.TABLE_NAME;
const OWNER_IPS = new Set(
  (process.env.OWNER_IPS ?? '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean),
);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'https://gopalcb.github.io';

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return response(204, {});
  }

  if (!TABLE_NAME) {
    return response(500, { message: 'TABLE_NAME is not configured.' });
  }

  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return response(400, { message: 'Request body must be valid JSON.' });
  }

  const visitId = cleanText(body.visit_id, 120);
  const pageLink = cleanText(body.page_link, 2048);
  if (!visitId || !pageLink) {
    return response(400, { message: 'visit_id and page_link are required.' });
  }

  const sourceIp = getSourceIp(event);
  const timestamp = new Date().toISOString();
  const viewId = randomUUID();
  const src = OWNER_IPS.has(sourceIp) ? `${sourceIp} (owner)` : sourceIp;

  const item = {
    view_id: viewId,
    visit_id: visitId,
    page_link: pageLink,
    route: cleanText(body.route, 512),
    page_title: cleanText(body.page_title, 256),
    site: cleanText(body.site, 120) || 'my-agentic-systems',
    event_timestamp: cleanText(body.timestamp, 64) || timestamp,
    stored_at: timestamp,
    country: getHeader(event, 'cloudfront-viewer-country') || getHeader(event, 'x-vercel-ip-country') || 'unknown',
    city: decodeHeaderValue(getHeader(event, 'cloudfront-viewer-city') || getHeader(event, 'x-vercel-ip-city')) || 'unknown',
    src,
    user_agent: cleanText(getHeader(event, 'user-agent'), 512),
  };

  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(view_id)',
    }),
  );

  return response(201, { ok: true, view_id: viewId });
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'access-control-allow-origin': ALLOWED_ORIGIN,
      'access-control-allow-methods': 'POST,OPTIONS',
      'access-control-allow-headers': 'content-type',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().slice(0, maxLength);
}

function getHeader(event, name) {
  const headers = event.headers ?? {};
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  return typeof match?.[1] === 'string' ? match[1] : '';
}

function getSourceIp(event) {
  const requestContextIp =
    event.requestContext?.http?.sourceIp ??
    event.requestContext?.identity?.sourceIp ??
    '';
  const forwardedFor = getHeader(event, 'x-forwarded-for').split(',')[0]?.trim() ?? '';
  return requestContextIp || forwardedFor || 'unknown';
}

function decodeHeaderValue(value) {
  if (!value) {
    return '';
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
