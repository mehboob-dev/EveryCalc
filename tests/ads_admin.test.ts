import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import {
  createAdminServer,
  readConfigFromDisk,
  writeConfigToDisk,
  publicConfigPath
} from '../scripts/ads-admin.mjs';

describe('Dedicated Ads Admin Panel & Direct JSON Updater', () => {
  let server: http.Server;
  let serverUrl: string;
  let originalFileContent: string;

  beforeAll(async () => {
    // Preserve original file content
    originalFileContent = fs.readFileSync(publicConfigPath, 'utf-8');

    server = createAdminServer();
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as { port: number };
        serverUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Restore original file
    fs.writeFileSync(publicConfigPath, originalFileContent, 'utf-8');
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('reads config directly from disk as a valid object', () => {
    const config = readConfigFromDisk();
    expect(config).toBeDefined();
    expect(config.version).toBeDefined();
    expect(config.adsense).toBeDefined();
    expect(config.affiliates).toBeDefined();
  });

  it('serves the admin panel HTML dashboard on GET /', async () => {
    const res = await fetch(`${serverUrl}/`);
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('EveryCalc Ads Admin');
    expect(html).toContain('Google AdSense Integration');
    expect(html).toContain('Direct JSON Edit');
  });

  it('returns JSON ads config on GET /api/config', async () => {
    const res = await fetch(`${serverUrl}/api/config`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.version).toBe(1);
    expect(json.adsense).toBeDefined();
    expect(json.affiliates).toBeDefined();
  });

  it('saves updated config directly to disk on POST /api/config', async () => {
    const current = readConfigFromDisk();
    const updatedTest = {
      ...current,
      adsense: {
        ...current.adsense,
        testMode: false
      }
    };

    const res = await fetch(`${serverUrl}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTest)
    });

    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.success).toBe(true);
    expect(result.config.adsense.testMode).toBe(false);

    // Verify it was written to disk
    const onDisk = JSON.parse(fs.readFileSync(publicConfigPath, 'utf-8'));
    expect(onDisk.adsense.testMode).toBe(false);
    expect(onDisk.updatedAt).toBeDefined();
  });

  it('saves and preserves AdSense fallback placeholder configuration', async () => {
    const current = readConfigFromDisk();
    const updatedWithPlaceholder = {
      ...current,
      adsense: {
        ...current.adsense,
        enabled: false,
        placeholder: {
          enabled: true,
          badge: 'Verified Sponsor',
          icon: '✨',
          title: 'Special Partner Deal',
          description: 'Special 10% discount on finance software.',
          ctaText: 'Claim Offer',
          url: 'https://earnkaro.com/special-deal'
        }
      }
    };

    const res = await fetch(`${serverUrl}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedWithPlaceholder)
    });

    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.success).toBe(true);
    expect(result.config.adsense.placeholder.title).toBe('Special Partner Deal');
    expect(result.config.adsense.placeholder.badge).toBe('Verified Sponsor');

    const onDisk = JSON.parse(fs.readFileSync(publicConfigPath, 'utf-8'));
    expect(onDisk.adsense.placeholder.title).toBe('Special Partner Deal');
    expect(onDisk.adsense.placeholder.badge).toBe('Verified Sponsor');
  });

  it('rejects malformed JSON with 400 status code', async () => {
    const res = await fetch(`${serverUrl}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not-a-valid-json }'
    });

    expect(res.status).toBe(400);
    const result = await res.json();
    expect(result.error).toBeDefined();
  });
});
