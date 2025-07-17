const sharp = require("sharp");
const nodemailer = require("nodemailer");

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Optimizes an image using Sharp
 */
async function optimizeImage(imagePath, outputPath, maxWidth = 800, quality = 80) {
  await sharp(imagePath)
    .resize(maxWidth)
    .jpeg({ quality })
    .toFile(outputPath);
}

/**
 * Generates PDF styles for catalog
 */
function generatePDFStyles() {
  return `
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      .page {
        width: 210mm;
        height: 297mm;
        padding: 20mm;
        box-sizing: border-box;
        page-break-after: always;
      }
      .cover-page {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        position: relative;
      }
      .product-page {
        display: flex;
        flex-direction: column;
      }
      .cover-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .logo-section {
        text-align: center;
        margin-top: 40px;
      }
      .contact-section {
        text-align: center;
        margin-top: auto;
        margin-bottom: 40px;
      }
    </style>
  `;
}

/**
 * Generates cover page HTML
 */
function generateCoverPageHTML(coverImageUrl, logo_url, catalog_name, contact_person, email, phone, street_address, city, state, zip_code, website) {
  const logoHTML = logo_url && logo_url.trim() !== '' && logo_url !== 'data:application/octet-stream;base64,' 
    ? `<img src="${logo_url}" alt="Logo" style="max-width: 200px; height: auto;">` 
    : '';

  return `
    <div class="page cover-page" style="position: relative; overflow: hidden;">
      <img src="${coverImageUrl}" alt="Cover" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" />
      <div class="cover-content">
        <div class="logo-section">
          ${logoHTML}
          <h1 style="margin-top: 10px;">${catalog_name}</h1>
        </div>
        <div class="contact-section">
          <p>${contact_person}</p>
          <p>${email} ${phone}</p>
          <p>${street_address}</p>
          <p>${city} ${state} ${zip_code}</p>
          <p>${website}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generates product pages HTML
 */
function generateProductPagesHTML(product_title, product_description, product_image, table_html) {
  return product_title.map((title, index) => `
    <div class="page product-page">
      <div style="display: flex; justify-content: center; margin-bottom: 20px;">
        <div style="text-align: center;">
          <img src="${product_image[index]}" alt="${title}" style="width:100%; max-width:300px;">
        </div>
      </div>
      <div>
        <h1>${title}</h1>
        <p>${product_description[index]}</p>
        ${table_html[index]}
      </div>
    </div>
  `).join('');
}

/**
 * Generates complete catalog HTML
 */
function generateCatalogHTML(catalogData, coverImageUrl) {
  const { logo_url, catalog_name, contact_person, email, phone, street_address, city, state, zip_code, website, product_title, product_description, product_image, table_html } = catalogData;

  return `
    ${generatePDFStyles()}
    ${generateCoverPageHTML(coverImageUrl, logo_url, catalog_name, contact_person, email, phone, street_address, city, state, zip_code, website)}
    ${generateProductPagesHTML(product_title, product_description, product_image, table_html)}
  `;
}

/**
 * Generates variant images HTML
 */
function generateVariantImagesHTML(variant_image_urls) {
  if (!variant_image_urls || variant_image_urls.length === 0) {
    return "";
  }

  const sortedImgs = variant_image_urls
    .split(",")
    .map(item => item.trim())
    .filter(item => item.length > 0);

  return sortedImgs.map(url => 
    `<img src="${url}|width=300" alt="Variant Image" style="width:100px; height:100px; margin:5px;">`
  ).join('');
}

/**
 * Validates required fields
 */
function validateRequiredFields(fields, requiredFields) {
  const missingFields = requiredFields.filter(field => !fields[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Creates and returns a configured nodemailer transporter
 */
function createEmailTransporter(emailConfig) {
  return nodemailer.createTransport(emailConfig);
}

/**
 * Generates PDF from HTML content
 */
async function generatePDFFromHTML(htmlContent, pdfOptions) {
  const html_to_pdf = require("html-pdf-node");
  const file = { content: htmlContent };
  
  return new Promise((resolve, reject) => {
    html_to_pdf.generatePdf(file, pdfOptions)
      .then(resolve)
      .catch(error => {
        console.error('PDF generation error:', error);
        reject(error);
      });
  });
}

/**
 * Sends email with PDF attachment
 */
async function sendEmailWithPDF(emailOptions, emailConfig) {
  // Test mode - don't actually send emails if credentials are missing
  const isTestMode = !emailConfig.auth.user || emailConfig.auth.user === 'test@example.com' || !emailConfig.auth.pass || emailConfig.auth.pass === 'test-password';
  
  if (isTestMode) {
    console.log("TEST MODE: Email would be sent to:", emailOptions.to);
    console.log("TEST MODE: Email subject:", emailOptions.subject);
    console.log("TEST MODE: Has attachment:", !!emailOptions.attachments);
    return Promise.resolve({ messageId: 'test-mode-message-id' });
  }
  
  const transporter = createEmailTransporter(emailConfig);
  
  return new Promise((resolve, reject) => {
    transporter.sendMail(emailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
}

module.exports = {
  optimizeImage,
  generatePDFStyles,
  generateCoverPageHTML,
  generateProductPagesHTML,
  generateCatalogHTML,
  generateVariantImagesHTML,
  validateRequiredFields,
  createEmailTransporter,
  generatePDFFromHTML,
  sendEmailWithPDF
}; 