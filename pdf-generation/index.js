const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const app = express();
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Import helper functions
const {
  optimizeImage,
  generateCatalogHTML,
  generateVariantImagesHTML,
  validateRequiredFields,
  generatePDFFromHTML,
  sendEmailWithPDF
} = require('./helpers');

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const CORS_OPTIONS = {
  origin: ["https://highcaliberline.com", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

const PDF_OPTIONS = {
  format: "A4",
  preferCSSPageSize: true,
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
  args: ['--no-sandbox', '--disable-setuid-sandbox']
};

const EMAIL_CONFIG = {
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'test@example.com',
    pass: process.env.EMAIL_PASS || 'test-password',
  },
  tls: {
    ciphers: "SSLv3",
    minVersion: 'TLSv1.2'
  },
};

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

app.use('/assets', express.static('assets'));
app.use(cors(CORS_OPTIONS));
app.options('*', cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

/**
 * Handle catalog creation
 */
app.post("/apps/create-catalog", async (req, res) => {
  const catalogData = req.body;
  const { cover_img, email, catalog_name, contact_person } = catalogData;

  try {
    // Validate required fields
    if (!cover_img) {
      console.log('No cover image provided');
      return res.status(400).send('Cover image is required');
    }

    // Process cover image
    const imageName = cover_img.startsWith('/') ? cover_img.slice(1) : cover_img;
    const imagePath = path.join(__dirname, 'assets', imageName);
    const optimizedImagePath = path.join(__dirname, 'assets', `optimized-${imageName}`);

    // Optimize image
    await optimizeImage(imagePath, optimizedImagePath);

    const coverImageUrl = new URL(`/assets/optimized-${imageName}`, BASE_URL).toString();

    // Generate HTML content
    const htmlContent = generateCatalogHTML(catalogData, coverImageUrl);

    // Generate PDF
    const pdfBuffer = await generatePDFFromHTML(htmlContent, PDF_OPTIONS);

    // Clean up optimized image
    fs.unlinkSync(optimizedImagePath);

    // Prepare email content
    const emailContent = `
      <div>Hi ${contact_person || 'there'},</div>
      <div>Please find attached your customized eCatalog.</div>
      <div>High Caliber Line Team</div>
    `;

    const emailName = catalog_name || 'e-catalog';
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Information about ${emailName}`,
      html: emailContent,
      attachments: [{
        filename: `${emailName}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    };

    // Send email
    await sendEmailWithPDF(mailOptions, EMAIL_CONFIG);

    // Send response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report-${Date.now()}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error in catalog creation:", error);
    console.error("Error stack:", error.stack);
    res.status(500).send(`There was an error generating the catalog: ${error.message}`);
  }
});

/**
 * Handle single product email
 */
app.post("/apps/send-email", async (req, res) => {
  const { email, product_title, product_description, product_image, table_html, variant_image_urls } = req.body;

  try {
    // Generate variant images HTML
    const variantImagesHtml = generateVariantImagesHTML(variant_image_urls);

    // Generate HTML content
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

    // Generate PDF
    const pdfBuffer = await generatePDFFromHTML(htmlContent, PDF_OPTIONS);

    // Prepare email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Information about ${product_title}`,
      html: htmlContent,
      attachments: [{
        filename: `${product_title}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    };

    // Send email
    await sendEmailWithPDF(mailOptions, EMAIL_CONFIG);
    res.send("Flyer sent with PDF attached!");

  } catch (error) {
    console.error("Error generating PDF:", error);
    console.error("Error stack:", error.stack);
    res.status(500).send(`There was an error generating the flyer: ${error.message}`);
  }
});

/**
 * Handle contact form / make an offer
 */
app.post("/apps/make-an-offer", async (req, res) => {
  const { "g-recaptcha-response": recaptchaResponse, customer_name, company, country, email, notes, cart_items, product_url } = req.body;

  try {
    // Validate CAPTCHA
    const captchaResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      {},
      {
        params: {
          secret: process.env.GOOGLE_CAPTCHA_SECRET,
          response: recaptchaResponse,
        },
      }
    );

    if (!captchaResponse.data.success) {
      return res.status(400).json({ 
        success: false, 
        message: "CAPTCHA failed, please try again." 
      });
    }

    // Validate required fields
    const validation = validateRequiredFields(
      { customer_name, company, country, email, notes },
      ['customer_name', 'company', 'country', 'email', 'notes']
    );

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${validation.missingFields.join(', ')}`
      });
    }

    // Process cart items
    const cartItems = JSON.parse(cart_items);
    const productsText = cartItems.map(item => `SKU: ${item.sku}:${item.title}`).join('\n');

    // Generate email body
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

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Contact from ${customer_name}`,
      text: emailBody,
    };

    await sendEmailWithPDF(mailOptions, EMAIL_CONFIG);

    return res.status(200).json({ 
      success: true, 
      message: "Email sent successfully" 
    });

  } catch (error) {
    console.error("Error handling form submission:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});