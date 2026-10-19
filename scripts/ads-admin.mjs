import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicConfigPath = path.join(rootDir, 'public', 'ads-config.json');
const distConfigPath = path.join(rootDir, 'dist', 'ads-config.json');

const PORT = Number(process.env.PORT) || 3333;

function readConfigFromDisk() {
  if (!fs.existsSync(publicConfigPath)) {
    throw new Error(`Target file not found: ${publicConfigPath}`);
  }
  const raw = fs.readFileSync(publicConfigPath, 'utf-8');
  return JSON.parse(raw);
}

function writeConfigToDisk(configObj) {
  if (typeof configObj !== 'object' || configObj === null) {
    throw new Error('Invalid JSON payload: expected a non-null object');
  }

  // Update timestamp
  configObj.updatedAt = new Date().toISOString();

  const formatted = JSON.stringify(configObj, null, 2) + '\n';
  fs.writeFileSync(publicConfigPath, formatted, 'utf-8');

  // Mirror to dist if dist exists
  if (fs.existsSync(path.dirname(distConfigPath))) {
    try {
      fs.writeFileSync(distConfigPath, formatted, 'utf-8');
    } catch {
      // Ignore non-fatal dist write errors
    }
  }

  return configObj;
}

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EveryCalc Ads Admin Panel</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f8fa;
      --card-bg: #ffffff;
      --card-border: #d0d7de;
      --text: #24292f;
      --text-heading: #1f2328;
      --text-muted: #656d76;
      --primary: #1f883d;
      --primary-hover: #1a7f37;
      --accent: #0969da;
      --danger: #cf222e;
      --danger-hover: #a40e26;
      --warning: #9a6700;
      --input-bg: #ffffff;
      --input-border: #d0d7de;
      --input-focus: #0969da;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding-bottom: 80px;
    }

    header {
      background: var(--card-bg);
      border-bottom: 1px solid var(--card-border);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(31, 35, 40, 0.08);
    }

    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 14px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand h1 {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-heading);
    }

    .badge {
      display: inline-block;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      background: var(--primary);
      color: #fff;
      font-weight: 500;
    }

    .badge-sub {
      background: #eaeef2;
      color: var(--accent);
      border: 1px solid var(--card-border);
      font-family: monospace;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    button {
      cursor: pointer;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 7px 14px;
      border-radius: 6px;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s, border-color 0.15s;
    }

    .btn-primary {
      background: var(--primary);
      color: #fff;
      border-color: rgba(31, 35, 40, 0.15);
    }
    .btn-primary:hover { background: var(--primary-hover); }

    .btn-secondary {
      background: #f6f8fa;
      color: var(--text-heading);
      border-color: var(--card-border);
    }
    .btn-secondary:hover { background: #eaeef2; border-color: #afb8c1; }

    .tabs {
      display: flex;
      gap: 4px;
      background: #eaeef2;
      padding: 3px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
    }

    .tab-btn {
      background: transparent;
      color: var(--text-muted);
      border: none;
      padding: 5px 12px;
      border-radius: 6px;
    }
    .tab-btn.active {
      background: #ffffff;
      color: var(--text-heading);
      box-shadow: 0 1px 3px rgba(31, 35, 40, 0.12);
    }

    main {
      max-width: 1200px;
      margin: 24px auto;
      padding: 0 20px;
    }

    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--primary);
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      font-weight: 500;
      font-size: 0.9rem;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s, transform 0.2s;
      transform: translateY(10px);
    }
    .toast.show {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
    .toast.error {
      background: var(--danger);
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(31, 35, 40, 0.04);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-heading);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    input[type="text"], input[type="url"], textarea {
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      color: var(--text-heading);
      padding: 8px 12px;
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.9rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: var(--input-focus);
      box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.18);
    }

    /* Switch toggle */
    .switch-label {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-transform: none;
      font-size: 0.9rem;
      color: var(--text-heading);
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 22px;
    }

    .switch input { opacity: 0; width: 0; height: 0; }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #d0d7de;
      transition: .2s;
      border-radius: 22px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: #fff;
      transition: .2s;
      border-radius: 50%;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }

    input:checked + .slider {
      background-color: var(--primary);
    }

    input:checked + .slider:before {
      transform: translateX(18px);
    }

    /* Affiliate item card */
    .affiliate-item {
      background: #f6f8fa;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .affiliate-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #d0d7de;
    }

    .aff-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--accent);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* JSON editor */
    #json-editor-container {
      display: none;
    }

    #json-textarea {
      width: 100%;
      height: 580px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 0.9rem;
      line-height: 1.45;
      background: #f6f8fa;
      border: 1px solid var(--card-border);
      color: #0550ae;
      border-radius: 8px;
      padding: 16px;
      resize: vertical;
      white-space: pre;
    }

    .json-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .validation-status {
      font-size: 0.85rem;
      font-weight: 600;
    }
    .status-valid { color: #1a7f37; }
    .status-invalid { color: #cf222e; }
  </style>
</head>
<body>

  <header>
    <div class="header-inner">
      <div class="brand">
        <h1>EveryCalc Ads Admin</h1>
        <span class="badge">Independent Mode</span>
        <span class="badge badge-sub">public/ads-config.json</span>
      </div>

      <div class="tabs">
        <button class="tab-btn active" id="tab-visual" onclick="switchTab('visual')">Visual Editor</button>
        <button class="tab-btn" id="tab-json" onclick="switchTab('json')">Direct JSON Edit</button>
      </div>

      <div class="actions">
        <button class="btn-secondary" onclick="fetchConfigFromDisk()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Reload from Disk
        </button>
        <button class="btn-primary" onclick="saveConfigToDisk()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save to JSON File
        </button>
      </div>
    </div>
  </header>

  <main>
    <!-- Visual Editor Section -->
    <div id="visual-editor-container">

      <!-- AdSense Section -->
      <section class="card">
        <div class="card-header">
          <div class="card-title">
            <span>📢 Google AdSense Integration</span>
          </div>
          <label class="switch-label">
            <span class="switch">
              <input type="checkbox" id="adsense-enabled">
              <span class="slider"></span>
            </span>
            <span>Enable AdSense</span>
          </label>
        </div>

        <div class="grid-3">
          <div class="form-group">
            <label for="adsense-client">Publisher Client ID</label>
            <input type="text" id="adsense-client" placeholder="ca-pub-0000000000000000">
          </div>
          <div class="form-group">
            <label for="adsense-slot">Default Ad Slot ID</label>
            <input type="text" id="adsense-slot" placeholder="0000000000">
          </div>
          <div class="form-group" style="justify-content: flex-end; padding-bottom: 6px;">
            <label class="switch-label">
              <span class="switch">
                <input type="checkbox" id="adsense-testmode">
                <span class="slider"></span>
              </span>
              <span>Test Mode (google_ad_test = on)</span>
            </label>
          </div>
        </div>

        <div style="margin-top: 18px; padding-top: 16px; border-top: 1px dashed var(--card-border);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-heading); display: flex; align-items: center; gap: 6px;">
              <span>🖼️ Fallback Ad Placeholder (Shown when AdSense is Disabled)</span>
            </div>
            <label class="switch-label">
              <span class="switch">
                <input type="checkbox" id="adsense-placeholder-enabled">
                <span class="slider"></span>
              </span>
              <span>Enable Placeholder</span>
            </label>
          </div>

          <div class="grid-3" style="margin-bottom: 12px;">
            <div class="form-group">
              <label for="adsense-placeholder-badge">Badge Text</label>
              <input type="text" id="adsense-placeholder-badge" placeholder="Sponsor Space">
            </div>
            <div class="form-group">
              <label for="adsense-placeholder-icon">Icon Emoji</label>
              <input type="text" id="adsense-placeholder-icon" placeholder="📢">
            </div>
            <div class="form-group">
              <label for="adsense-placeholder-title">Title / Headline</label>
              <input type="text" id="adsense-placeholder-title" placeholder="Advertise on EveryCalc">
            </div>
          </div>

          <div class="grid-3">
            <div class="form-group">
              <label for="adsense-placeholder-desc">Description</label>
              <input type="text" id="adsense-placeholder-desc" placeholder="Promote your brand or service...">
            </div>
            <div class="form-group">
              <label for="adsense-placeholder-cta">Button CTA Text</label>
              <input type="text" id="adsense-placeholder-cta" placeholder="Partner With Us">
            </div>
            <div class="form-group">
              <label for="adsense-placeholder-url">Target Link URL</label>
              <input type="url" id="adsense-placeholder-url" placeholder="https://earnkaro.com">
            </div>
          </div>
        </div>
      </section>

      <!-- Affiliate Cards Section -->
      <section class="card">
        <div class="card-header">
          <div class="card-title">
            <span>💼 Contextual Affiliate Cards (EarnKaro / Partner Deals)</span>
          </div>
          <button class="btn-secondary" onclick="addAffiliateSlot()">+ Add Slot</button>
        </div>

        <div id="affiliates-list"></div>
      </section>

      <!-- Sponsor Banner Section -->
      <section class="card">
        <div class="card-header">
          <div class="card-title">
            <span>⭐ Sponsored Header Banner</span>
          </div>
          <label class="switch-label">
            <span class="switch">
              <input type="checkbox" id="sponsor-enabled">
              <span class="slider"></span>
            </span>
            <span>Enable Sponsor Banner</span>
          </label>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="sponsor-text">Banner Text</label>
            <input type="text" id="sponsor-text" placeholder="Promotional copy...">
          </div>
          <div class="form-group">
            <label for="sponsor-badge">Badge Label</label>
            <input type="text" id="sponsor-badge" placeholder="Sponsored">
          </div>
          <div class="form-group">
            <label for="sponsor-cta">CTA Button Text</label>
            <input type="text" id="sponsor-cta" placeholder="Consult Expert">
          </div>
          <div class="form-group">
            <label for="sponsor-url">Destination URL</label>
            <input type="url" id="sponsor-url" placeholder="https://...">
          </div>
        </div>
      </section>

    </div>

    <!-- Direct JSON Editor Section -->
    <div id="json-editor-container">
      <div class="json-actions">
        <div>
          <span class="validation-status status-valid" id="json-status">✓ Valid JSON</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-secondary" onclick="formatJsonTextarea()">Prettify JSON</button>
        </div>
      </div>
      <textarea id="json-textarea" spellcheck="false"></textarea>
    </div>
  </main>

  <div class="toast" id="toast">Changes saved to public/ads-config.json</div>

  <script>
    let activeConfig = null;
    let currentTab = 'visual';

    function showToast(msg, isError = false) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.className = 'toast show' + (isError ? ' error' : '');
      setTimeout(() => { toast.className = 'toast'; }, 3000);
    }

    const TOOL_NAMES = {
      'LON': 'Loan Calculator',
      'IRA': 'SIP / Savings Calculator',
      'ITX': 'Income Tax Calculator',
      'GLD': 'Gold & Jewelry Calculator',
      'TAX': 'GST Calculator',
      'SAL': 'Salary Calculator',
      'NOR': 'General Calculator',
      'UNT': 'Unit Converter',
      'CUR': 'Currency Converter',
      'DCT': 'Discount Calculator',
      'TIP': 'Tip Calculator',
      'PER': 'Percentage Calculator',
      'UPR': 'Unit Price Calculator',
      'DAT': 'Date Calculator',
      'HET': 'Health Calculator',
      'FCS': 'Fuel Cost Calculator',
      'FFC': 'Fuel Efficiency',
      'GPA': 'Grade Average (GPA)',
      'HEX': 'Hexadecimal Converter',
      'LDC': 'Ovulation Calculator',
      'TMZ': 'World Timezone'
    };

    function getToolLabel(id) {
      const name = TOOL_NAMES[id];
      return name ? (id + ': ' + name) : id;
    }

    async function fetchConfigFromDisk() {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('Failed to load configuration');
        activeConfig = await res.json();
        renderActiveConfig();
        showToast('Loaded latest ads-config.json from disk');
      } catch (err) {
        showToast(err.message, true);
      }
    }

    function renderActiveConfig() {
      if (!activeConfig) return;

      // AdSense
      document.getElementById('adsense-enabled').checked = !!(activeConfig.adsense && activeConfig.adsense.enabled);
      document.getElementById('adsense-client').value = (activeConfig.adsense && activeConfig.adsense.client) || '';
      document.getElementById('adsense-slot').value = (activeConfig.adsense && activeConfig.adsense.slot) || '';
      document.getElementById('adsense-testmode').checked = !!(activeConfig.adsense && activeConfig.adsense.testMode);

      // AdSense Placeholder
      const placeholder = (activeConfig.adsense && activeConfig.adsense.placeholder) || {};
      document.getElementById('adsense-placeholder-enabled').checked = placeholder.enabled !== false;
      document.getElementById('adsense-placeholder-badge').value = placeholder.badge || '';
      document.getElementById('adsense-placeholder-icon').value = placeholder.icon || '';
      document.getElementById('adsense-placeholder-title').value = placeholder.title || '';
      document.getElementById('adsense-placeholder-desc').value = placeholder.description || '';
      document.getElementById('adsense-placeholder-cta').value = placeholder.ctaText || '';
      document.getElementById('adsense-placeholder-url').value = placeholder.url || '';

      // Sponsor
      const sponsor = (activeConfig.sponsors && activeConfig.sponsors[0]) || {};
      document.getElementById('sponsor-enabled').checked = !!sponsor.enabled;
      document.getElementById('sponsor-text').value = sponsor.text || '';
      document.getElementById('sponsor-badge').value = sponsor.badge || '';
      document.getElementById('sponsor-cta').value = sponsor.ctaText || '';
      document.getElementById('sponsor-url').value = sponsor.url || '';

      // Affiliates
      renderAffiliatesList();

      // JSON textarea
      document.getElementById('json-textarea').value = JSON.stringify(activeConfig, null, 2);
      validateJsonSyntax();
    }

    function renderAffiliatesList() {
      const container = document.getElementById('affiliates-list');
      container.innerHTML = '';
      const affiliates = activeConfig.affiliates || {};

      for (const [key, item] of Object.entries(affiliates)) {
        const isEnabled = item.enabled !== false;
        const div = document.createElement('div');
        div.className = 'affiliate-item';
        div.id = 'aff-item-' + key;
        div.innerHTML = \`
          <div class="affiliate-item-header">
            <div class="aff-title">
              <span style="font-size: 1.25rem;">\${item.icon || '💼'}</span>
              <span>
                <strong style="font-size: 0.95rem; color: var(--text-heading); font-family: ui-monospace, monospace;">\${escapeHtml(getToolLabel(key))}</strong>
                <span style="display: block; font-size: 0.78rem; font-weight: normal; color: var(--text-muted);">Partner: \${escapeHtml(item.partnerName || 'Affiliate Partner')}</span>
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
              <label class="switch-label">
                <span class="switch">
                  <input type="checkbox" \${isEnabled ? 'checked' : ''} onchange="updateAffiliateField('\${key}', 'enabled', this.checked)">
                  <span class="slider"></span>
                </span>
                <span>Active</span>
              </label>
              <button class="btn-secondary" style="color: var(--danger); border-color: var(--card-border); background: #ffffff; padding: 4px 10px;" onclick="removeAffiliateSlot('\${key}')">Delete</button>
            </div>
          </div>
          <div class="grid-3" style="margin-bottom: 12px;">
            <div class="form-group">
              <label>Headline Title</label>
              <input type="text" value="\${escapeHtml(item.title || '')}" oninput="updateAffiliateField('\${key}', 'title', this.value)">
            </div>
            <div class="form-group">
              <label>Partner / Brand Name</label>
              <input type="text" value="\${escapeHtml(item.partnerName || '')}" oninput="updateAffiliateField('\${key}', 'partnerName', this.value)">
            </div>
            <div class="form-group">
              <label>Badge Text</label>
              <input type="text" value="\${escapeHtml(item.badgeText || '')}" oninput="updateAffiliateField('\${key}', 'badgeText', this.value)">
            </div>
          </div>
          <div class="grid-3" style="margin-bottom: 12px;">
            <div class="form-group">
              <label>Destination Affiliate URL</label>
              <input type="url" value="\${escapeHtml(item.url || '')}" oninput="updateAffiliateField('\${key}', 'url', this.value)">
            </div>
            <div class="form-group">
              <label>CTA Button Text</label>
              <input type="text" value="\${escapeHtml(item.ctaText || '')}" oninput="updateAffiliateField('\${key}', 'ctaText', this.value)">
            </div>
            <div class="form-group">
              <label>Icon Emoji</label>
              <input type="text" value="\${escapeHtml(item.icon || '💼')}" oninput="updateAffiliateField('\${key}', 'icon', this.value)">
            </div>
          </div>
          <div class="form-group">
            <label>Description / Benefits</label>
            <textarea rows="2" oninput="updateAffiliateField('\${key}', 'description', this.value)">\${escapeHtml(item.description || '')}</textarea>
          </div>
        \`;
        container.appendChild(div);
      }
    }

    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function updateAffiliateField(key, field, val) {
      if (!activeConfig.affiliates[key]) return;
      activeConfig.affiliates[key][field] = val;
      syncToJsonTextarea();
    }

    function addAffiliateSlot() {
      const input = prompt('Enter Calculator Tool ID (e.g. LON, IRA, ITX, GLD, TAX, SAL):');
      if (!input) return;
      const toolId = input.trim().toUpperCase();
      if (!toolId) return;

      if (!activeConfig.affiliates) activeConfig.affiliates = {};
      if (activeConfig.affiliates[toolId]) {
        alert('Affiliate slot for ' + getToolLabel(toolId) + ' already exists!');
        return;
      }

      const toolName = TOOL_NAMES[toolId] || toolId;
      activeConfig.affiliates[toolId] = {
        id: 'aff-' + toolId.toLowerCase(),
        toolId: toolId,
        enabled: true,
        title: 'Special Offer for ' + toolName,
        partnerName: 'Partner Name',
        badgeText: 'Verified Partner',
        description: 'Details and terms of this offer.',
        ctaText: 'Claim Deal',
        url: 'https://earnkaro.com',
        icon: '💼'
      };
      renderAffiliatesList();
      syncToJsonTextarea();
      showToast('Added slot for ' + getToolLabel(toolId));
    }

    function removeAffiliateSlot(key) {
      if (!confirm('Are you sure you want to delete the affiliate slot for ' + key + '?')) return;
      delete activeConfig.affiliates[key];
      renderAffiliatesList();
      syncToJsonTextarea();
    }

    function collectVisualFormData() {
      if (!activeConfig) activeConfig = {};

      // AdSense
      activeConfig.adsense = {
        enabled: document.getElementById('adsense-enabled').checked,
        client: document.getElementById('adsense-client').value.trim(),
        slot: document.getElementById('adsense-slot').value.trim(),
        testMode: document.getElementById('adsense-testmode').checked,
        placeholder: {
          enabled: document.getElementById('adsense-placeholder-enabled').checked,
          badge: document.getElementById('adsense-placeholder-badge').value.trim(),
          icon: document.getElementById('adsense-placeholder-icon').value.trim(),
          title: document.getElementById('adsense-placeholder-title').value.trim(),
          description: document.getElementById('adsense-placeholder-desc').value.trim(),
          ctaText: document.getElementById('adsense-placeholder-cta').value.trim(),
          url: document.getElementById('adsense-placeholder-url').value.trim()
        }
      };

      // Sponsors
      activeConfig.sponsors = [
        {
          enabled: document.getElementById('sponsor-enabled').checked,
          toolId: '*',
          badge: document.getElementById('sponsor-badge').value.trim(),
          text: document.getElementById('sponsor-text').value.trim(),
          ctaText: document.getElementById('sponsor-cta').value.trim(),
          url: document.getElementById('sponsor-url').value.trim()
        }
      ];

      return activeConfig;
    }

    function syncToJsonTextarea() {
      collectVisualFormData();
      document.getElementById('json-textarea').value = JSON.stringify(activeConfig, null, 2);
      validateJsonSyntax();
    }

    function validateJsonSyntax() {
      const statusEl = document.getElementById('json-status');
      try {
        const val = document.getElementById('json-textarea').value;
        JSON.parse(val);
        statusEl.textContent = '✓ Valid JSON';
        statusEl.className = 'validation-status status-valid';
        return true;
      } catch (err) {
        statusEl.textContent = '✗ ' + err.message;
        statusEl.className = 'validation-status status-invalid';
        return false;
      }
    }

    document.getElementById('json-textarea').addEventListener('input', validateJsonSyntax);

    function formatJsonTextarea() {
      try {
        const parsed = JSON.parse(document.getElementById('json-textarea').value);
        document.getElementById('json-textarea').value = JSON.stringify(parsed, null, 2);
        validateJsonSyntax();
      } catch (err) {
        alert('Cannot format invalid JSON: ' + err.message);
      }
    }

    function switchTab(tab) {
      if (tab === currentTab) return;

      if (tab === 'json') {
        collectVisualFormData();
        document.getElementById('json-textarea').value = JSON.stringify(activeConfig, null, 2);
        validateJsonSyntax();
        document.getElementById('visual-editor-container').style.display = 'none';
        document.getElementById('json-editor-container').style.display = 'block';
        document.getElementById('tab-visual').className = 'tab-btn';
        document.getElementById('tab-json').className = 'tab-btn active';
      } else {
        if (!validateJsonSyntax()) {
          alert('Cannot switch to Visual Form because current JSON contains syntax errors.');
          return;
        }
        activeConfig = JSON.parse(document.getElementById('json-textarea').value);
        renderActiveConfig();
        document.getElementById('visual-editor-container').style.display = 'block';
        document.getElementById('json-editor-container').style.display = 'none';
        document.getElementById('tab-visual').className = 'tab-btn active';
        document.getElementById('tab-json').className = 'tab-btn';
      }
      currentTab = tab;
    }

    async function saveConfigToDisk() {
      let configToSave;
      if (currentTab === 'json') {
        if (!validateJsonSyntax()) {
          showToast('JSON syntax error! Cannot save.', true);
          return;
        }
        configToSave = JSON.parse(document.getElementById('json-textarea').value);
      } else {
        configToSave = collectVisualFormData();
      }

      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configToSave)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save');

        activeConfig = data.config;
        renderActiveConfig();
        showToast('✓ Saved directly to public/ads-config.json (' + data.config.updatedAt.slice(11, 19) + ' UTC)');
      } catch (err) {
        showToast(err.message, true);
      }
    }

    // Initialize
    fetchConfigFromDisk();
  </script>
</body>
</html>
`;

export { readConfigFromDisk, writeConfigToDisk, publicConfigPath, distConfigPath, PORT };

export function createAdminServer() {
  return http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = parsedUrl.pathname;

    // CORS headers for local dev convenience
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // API: GET config
    if (req.method === 'GET' && pathname === '/api/config') {
      try {
        const config = readConfigFromDisk();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(config));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // API: POST config
    if (req.method === 'POST' && pathname === '/api/config') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const updated = writeConfigToDisk(parsed);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            message: 'Saved to public/ads-config.json',
            config: updated
          }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Frontend UI
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HTML_PAGE);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirectRun) {
  const server = createAdminServer();
  server.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 EveryCalc Ads Admin Panel running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📁 Target File: ${publicConfigPath}`);
    console.log(`=================================================\n`);
  });
}
