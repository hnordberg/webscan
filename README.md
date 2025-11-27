# WebScan

A web scraping tool that monitors multiple websites for new product listings and sends notifications via email and desktop alerts when changes are detected.

## Educational use only

Please note that this code is for educational use only. If you want to use this to actually scan sites, you must implement robots.txt handling.

## Overview

WebScan continuously monitors configured websites, tracks product listings, and alerts you when new products appear. It's particularly useful for monitoring e-commerce sites for new inventory, price changes, or specific product availability.

## Features

- **Multi-site monitoring**: Scan multiple websites simultaneously
- **Product tracking**: Remembers previously seen products to detect new additions
- **Filtering**: Include/exclude products based on keywords
- **Notifications**: Desktop notifications and email alerts for new products
- **Configurable intervals**: Set custom scan intervals per site
- **Logging**: Comprehensive logging with log4js
- **HTTPS server**: Built-in HTTPS server for secure operation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SSL certificates (cert.pem, key.pem) in the `resources/` directory
- Gmail OAuth2 credentials for email notifications

## Installation

1. Clone the repository:
```bash
git clone https://github.com/hnordberg/webscan.git
cd webscan
```

2. Install dependencies:
```bash
npm install
```

3. Set up SSL certificates:
   - Place your SSL certificate files (`cert.pem` and `key.pem`) in the `resources/` directory
   - See `resources/readme.md` for more details

4. Configure the application:
   - Copy `config/local.yaml` and modify it with your settings
   - Configure email OAuth2 credentials
   - Add sites to monitor

## Configuration

Configuration is managed through YAML files in the `config/` directory. The main configuration file is `config/local.yaml`.

### Email Configuration

Set up Gmail OAuth2 credentials:
```yaml
email:
  service: 'gmail'
  host: 'smtp.gmail.com'
  port: 465
  secure: true
  auth:
    clientId: 'your-client-id'
    clientSecret: 'your-client-secret'
    accessToken: 'your-access-token'
    refreshToken: 'your-refresh-token'
  to: 'your-email@gmail.com'
  subject: 'webscan: '
```

### Site Configuration

Add sites to monitor in the `sites` array:

```yaml
sites:
  - name: 'Site Name'
    uri: 'https://example.com/products'
    selector: '.product-title'  # CSS selector for product elements
    intervalInSeconds: 300      # Scan interval in seconds, be nice!
    disabled: false             # Set to true to disable scanning
    filterOut: ['Sold Out']     # Optional: exclude products containing these strings
    includeOnly: ['Keyword']    # Optional: only include products containing these strings
    printRawHtml: false         # Optional: print raw HTML for debugging
```

### General Configuration

```yaml
general:
  numberOfProductsToRemember: 200  # Maximum number of products to track per site
```

### Server Configuration

```yaml
server:
  log_level: info
  log_dir: ./logs
  cert_dir: resources
  passphrase: changeit
  port: 3000  # Optional, defaults to 3000 or PORT environment variable
```

## Usage

### Start the application:

```bash
npm start
```

### Development mode (with auto-reload):

```bash
npm run startDev
```

### Development mode (without killing existing process):

```bash
npm run startDevNoExp
```

### Debug mode (with Express debugging):

```bash
npm run startDevDebugExpress
```

## How It Works

1. **Initialization**: The application starts an HTTPS server and begins scanning configured sites
2. **Scanning**: Each site is scanned at its configured interval using HTTP requests with browser-like headers
3. **Parsing**: HTML responses are parsed using Cheerio to extract product information using CSS selectors
4. **Tracking**: Products are tracked in memory. New products are identified by comparing against previously seen products
5. **Filtering**: Products are filtered based on `filterOut` and `includeOnly` rules
6. **Notifications**: When new products are detected:
   - Desktop notification is sent
   - Email notification is sent via Gmail
   - Log entry is created

## Project Structure

```
webscan/
├── config/           # Configuration files (YAML)
├── logs/             # Application logs
├── resources/        # SSL certificates and other resources
├── utils/            # Utility modules (logger.js)
├── index.js          # Application entry point
├── scanner.js        # Core scanning logic
└── package.json      # Dependencies and scripts
```

## Dependencies

- **cheerio**: HTML parsing and manipulation
- **config**: Configuration management
- **express**: Web server framework
- **js-yaml**: YAML parsing
- **log4js**: Logging
- **node-notifier**: Desktop notifications
- **nodemailer**: Email sending
- **request-promise**: HTTP requests

## Troubleshooting

- **Email not sending**: Verify OAuth2 credentials and ensure access tokens are valid
- **No products detected**: Check CSS selectors match the website structure
- **SSL errors**: Ensure certificates are properly placed in the `resources/` directory
- **Port already in use**: Change the port in configuration or kill the existing process

## License

MIT License

## Author

Henrik Nordberg


