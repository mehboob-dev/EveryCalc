# EveryCalc - All-in-One Multi Calculator Suite

> High-precision, offline-first multi-functional calculator suite built with TypeScript and Decimal.js.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-green.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

**EveryCalc** is a high-precision, offline-first Progressive Web Application (PWA) that combines 18 specialized calculators, converters, and financial planning tools into a single fast, responsive, and privacy-focused suite.

---

## Features

- **Arbitrary-Precision Arithmetic**: Powered by `decimal.js` to eliminate IEEE 754 binary floating-point rounding errors.
- **18 Specialized Calculators & Converters**:
  - **General & Scientific**: Basic arithmetic, trigonometric functions, logarithms, parentheses, and constants (π, e).
  - **Financial**: Multi-frequency loan EMI calculator, amortization schedule modal with CSV export, compound interest, savings goal planner.
  - **Business & Commerce**: Discount calculator, GST/Sales tax estimator, unit price comparison.
  - **Unit & Currency**: Multi-category unit converter (length, mass, volume, temperature, speed, area) with favorite pinning, and exchange rates.
  - **Health & Lifestyle**: BMI and body fat estimator, fuel cost and mileage calculator, tip splitter.
  - **Date & Time**: Date difference, D-Day & milestone countdown, global 24-hour interactive timezone scrubber.
  - **Engineering**: Hexadecimal / Binary / Octal / Decimal programmer calculator, GPA calculator.
- **Offline-First PWA**: Installs to home screen on iOS, Android, macOS, and Windows. Fully operational without internet connectivity via Service Worker cache.
- **Privacy First**: All calculations, history, and preferences stay 100% in local browser storage. No user telemetry or tracking.
- **Multi-Language (i18n)**: Native internationalization supporting English, Spanish, Brazilian Portuguese, Hindi, German, and French.
- **Haptic & Sound Feedback**: Tactile audio and vibration feedback for native app responsiveness.

---

## Tech Stack

- **Runtime**: Modern Vanilla TypeScript (ESNext)
- **Bundler**: Vite
- **Math Engine**: Decimal.js
- **Testing**: Vitest (130+ unit and integration tests)
- **Styling**: Native CSS3 with CSS variables and responsive viewport design

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
git clone https://github.com/mehboob-itqantrades/everycalc.git
cd everycalc
npm install
```

### Development

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```

The compiled static assets will be output to `dist/`.

---

## Deployment

EveryCalc is pre-configured for automated zero-config deployment to **GitHub Pages** using GitHub Actions (`.github/workflows/deploy.yml`).

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
