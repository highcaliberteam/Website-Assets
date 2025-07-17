# Flyer & Catalog Generator API

A Node.js Express application for generating product catalogs and flyers with PDF generation and email delivery capabilities.

## Features

- **Product Catalog Generation** - Create multi-product catalogs with custom cover pages
- **Single Product Flyers** - Generate individual product flyers with variant images
- **PDF Generation** - Convert HTML content to professional PDF documents
- **Email Integration** - Send generated PDFs via email with SMTP support
- **Image Optimization** - Automatic image resizing and compression with Sharp
- **Contact Form Processing** - Handle customer inquiries with CAPTCHA validation
- **Health Monitoring** - Built-in health check endpoint for monitoring

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
1. Clone the repository
```bash
git clone 
cd create-a-flyer-hcl
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables (see [Environment Variables](#environment-variables))

4. Start the server
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### Create Catalog
```
POST /apps/create-catalog
```
Generates a multi-product catalog with cover page and sends via email.

**Request Body:**
```json
{
  "product_title": ["Product 1", "Product 2"],
  "product_description": ["Description 1", "Description 2"],
  "product_image": ["image1.jpg", "image2.jpg"],
  "table_html": ["<table>...</table>", "<table>...</table>"],
  "logo_url": "https://example.com/logo.png",
  "catalog_name": "2024 Product Catalog",
  "contact_person": "John Doe",
  "email": "customer@example.com",
  "phone": "+1-555-123-4567",
  "street_address": "123 Business St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "website": "https://example.com",
  "cover_img": "cover-1-colorful.jpg"
}
```

### Send Product Flyer
```
POST /apps/send-email
```
Generates and emails a single product flyer.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "product_title": "Premium Widget",
  "product_description": "High-quality widget description",
  "product_image": "https://example.com/product.jpg",
  "table_html": "<table><tr><th>Feature</th><th>Value</th></tr></table>",
  "variant_image_urls": "img1.jpg, img2.jpg, img3.jpg"
}
```

### Contact Form / Make an Offer
```
POST /apps/make-an-offer
```
Processes contact form submissions with CAPTCHA validation.

**Request Body:**
```json
{
  "g-recaptcha-response": "captcha-response-token",
  "customer_name": "Jane Smith",
  "company": "Smith Corp",
  "country": "United States",
  "email": "jane@smithcorp.com",
  "notes": "Interested in bulk pricing",
  "cart_items": "[{\"sku\":\"PROD-001\",\"title\":\"Product Name\"}]",
  "product_url": "https://example.com/products/widget"
}
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required for Production
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
RECIPIENT_EMAIL=sales@yourcompany.com
GOOGLE_CAPTCHA_SECRET=your-google-captcha-secret-key
```

### Optional
```env
BASE_URL=http://localhost:3000
PORT=3000
```

### Email Setup
For Gmail, use an App Password:
1. Enable 2-factor authentication
2. Generate an App Password in Google Account settings
3. Use the 16-character App Password (not your regular password)

## Project Structure

```
create-a-flyer-hcl/
├── assets/                 # Cover images and static assets
│   ├── cover-1-colorful.jpg
│   ├── cover-2-teal-shapes.jpg
│   └── ...
├── index.js               # Main Express application
├── helpers.js             # Utility functions
├── package.json           # Dependencies and scripts
├── package-lock.json      # Dependency lock file
└── .gitignore            # Git ignore rules
```

## Dependencies

### Core Dependencies
- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **body-parser** - Request body parsing
- **nodemailer** - Email sending
- **sharp** - Image processing
- **html-pdf-node** - PDF generation
- **axios** - HTTP client
- **dotenv** - Environment variable management

## Development

### Test Mode
The application includes a test mode that activates when email credentials are missing or set to test values. In test mode:
- Email sending is simulated (logged to console)
- PDF generation still works
- All other functionality remains intact

### Debugging
Use the health check endpoint to verify server status:
```bash
curl http://localhost:3000/health
```

## Deployment

### Heroku
```bash
git add .
git commit -m "message"
git push heroku main
```

### Environment Variables on Heroku
```bash
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-app-password
heroku config:set RECIPIENT_EMAIL=sales@company.com
heroku config:set GOOGLE_CAPTCHA_SECRET=your-secret
heroku config:set BASE_URL=https://your-app.herokuapp.com
```

## Usage Examples

### Generate a Product Catalog
```javascript
const response = await fetch('/apps/create-catalog', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_title: ["Widget Pro", "Widget Lite"],
    product_description: ["Professional grade", "Consumer grade"],
    // ... other fields
  })
});
```

### Send a Product Flyer
```javascript
const response = await fetch('/apps/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "customer@example.com",
    product_title: "Amazing Widget",
    // ... other fields
  })
});
```

## Error Handling

The API returns detailed error messages in both development and production:
- HTTP status codes indicate the type of error
- Error messages include specific details about what went wrong
- Stack traces are logged server-side for debugging

## Customizing Email Templates

If you need to modify the email templates you can directly edit the email templates in the `index.js` file. Here's how to customize each type of email:

### 1. Catalog Email Template

**Location:** `index.js`, lines 87-91

**Current template:**
```javascript
const emailContent = `
  <div>Hi ${contact_person || 'there'},</div>
  <div>Please find attached your customized eCatalog.</div>
  <div>High Caliber Line Team</div>
`;
```

**To customize:** Replace the text between the backticks with your desired message. You can use HTML tags for formatting and include variables like `${contact_person}` or `${catalog_name}`.

**Example customization:**
```javascript
const emailContent = `
  <div>Dear ${contact_person || 'Valued Customer'},</div>
  <div>Thank you for your interest! Please find your custom ${catalog_name || 'product catalog'} attached.</div>
  <div>If you have any questions, please don't hesitate to contact us.</div>
  <div>Best regards,<br>Your Company Name Sales Team</div>
`;
```

### 2. Product Flyer Email Template

**Location:** `index.js`, lines 128-146

The product flyer email template is built using the HTML content directly. To customize the email layout:

**Find this section:**
```javascript
const htmlContent = `
  <div style="display: flex; align-items: flex-start;">
    <div style="flex: 1;">
      <img src="${product_image}" alt="${product_title}" style="width:100%; max-width:400px; margin-right: 20px;">
    </div>
    <div style="flex: 1; display: flex; flex-wrap: wrap;">
      ${variantImagesHtml}
    </div>
  </div>
  <div style="margin-top: 20px;">
    <h1>${product_title}</h1>
    <p>${product_description}</p>
    ${table_html}
  </div>
`;
```

### 3. Contact Form Email Template

**Location:** `index.js`, lines 207-219

**Current template:**
```javascript
const emailBody = `
Hello,
You have received a new lead.

Details:
        Customer Name: ${customer_name}
        Email: ${email}
        Country: ${country}
        Company: ${company || "N/A"}
        Note from Customer: ${notes || "N/A"}

Product Link: ${product_url}

Products:
${productsText}
    `;
```

**To customize:** Replace with your preferred format for lead notifications.

**Example customization:**
```javascript
const emailBody = `
NEW LEAD ALERT!

Customer Information:
Email: ${email}
Name: ${customer_name}
Company: ${company || "Not provided"}
Country: ${country}

Customer Message:
"${notes || "No additional notes provided"}"

Product of Interest: ${product_url}

Products Inquired About:
${productsText}

Please follow up promptly!
    `;
```

### 4. Email Subject Lines

You can also customize email subject lines:

- **Catalog emails:** Line 98 - `subject: \`Information about \${emailName}\``
- **Product flyer emails:** Line 156 - `subject: \`Information about \${product_title}\``
- **Contact form emails:** Line 237 - `subject: \`New Contact from \${customer_name}\``

