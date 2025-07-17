class FreightForm extends HTMLElement {
  constructor() {
    super();

    this.content = document.querySelector('.freight_estimator__content');
    this.media = document.querySelector('.freight_estimator__media');

    this.submitButton = this.querySelector('button[type="submit"]');
    this.submitButton.addEventListener('click', this.submitForm.bind(this));
    this.inputs = this.querySelectorAll('input');

    this.toggle = document.querySelector('.product-freight-modal__toggle');
    this.toggle.addEventListener('click', this.toggleModal.bind(this));

    this.spinner = document.querySelector('.loading__spinner--freight');
    this.error = document.querySelector('.error-message__freight');

    this.postal_code = '';
    this.product_sku = '';
  }

  toggleModal() {
    this.media.style.display = 'block';
  }

  submitForm(event) {
    event.preventDefault();
    const data = {};

    // Gather form inputs into the data object
    this.inputs.forEach((input) => {
      data[input.name] = input.value;
      if (input.name === 'postal_code') {
        this.postal_code = input.value;
      }
      if (input.name === 'quantity') {
        this.product_quantity = input.value;
      }
      if (input.name === 'sku') {
        this.product_sku = input.value;
      }
    });

    this.spinner.style.display = 'flex';
    this.media.style.display = 'none';

    // Create a fetch request for the data
    fetch('https://fedex-freight-rate-bede9bc83709.herokuapp.com/fedex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        this.updateResults(data);
      })
      .catch((error) => {
        console.error('Error:', error);
        this.showError();
      });
  }

  showError() {
    this.error.style.display = 'block';
  }

  updateResults(data) {
    this.spinner.style.display = 'none';
    const $results = document.querySelector('.fedex__content');
    $results.innerHTML = ''; // Clear previous results

    if (!data.product_info || data.product_info == null) {
      this.showError();
      return;
    }

    // Example data object
    //   {
    //     "service_name": "FedEx Ground®",
    //     "service_type": "FEDEX_GROUND",
    //     "transit_time": "7 days",
    //     "delivery_time": "Mon, 2024-11-11T23:59:00",
    //     "fedex_price": 376.6,
    //     "your_cost": 151.06
    // }

    // Create the main container
    const quoteSummary = document.createElement('div');
    quoteSummary.classList.add('freight-estimator__summary-section');

    // Create and fill the Quote Summary table
    const quoteTable = `
      <h3>Quote Summary</h3>
      <table class="freight-estimator__table">
        <tr>
          <th>Product SKU</th>
          <th>Product QTY</th>
          <th>Ship From</th>
          <th>Ship To</th>
        </tr>
        <tr>
          <td>${data.product_info.sku || this.product_sku}</td>
          <td>${
            data.product_info.product_quantity || this.product_quantity
          }</td>
          <td>${data.product_info.ship_to || '91702'}</td>
          <td>${data.product_info.ship_from || this.postal_code}</td>
        </tr>
      </table>
    `;

    // Create and fill the Package Summary table
    const packageSummary = `
      <h3>Package Summary</h3>
      <table class="freight-estimator__table">
        <tr>
          <th>Number of Cartons</th>
          <th>QTY Per Carton</th>
          <th>Dimensions</th>
          <th>Total Weight</th>
        </tr>
        <tr>
          <td>${data.product_info.number_of_carton || 'N/A'}</td>
          <td>${data.product_info.qty_per_carton || 'N/A'}</td>
          <td>${data.product_info.dimension || 'N/A'}</td>
          <td>${data.product_info.total_weight || 'N/A'} lbs</td>
        </tr>
      </table>
    `;

    // Append tables to the main container
    quoteSummary.innerHTML = quoteTable + packageSummary;
    $results.appendChild(quoteSummary);

    // Create and fill the Service Options table
    const serviceOptionsSection = document.createElement('div');
    serviceOptionsSection.classList.add('service-options-section');

    let serviceOptionsTable = `
      <h3>Service Options</h3>
      <table class="freight-estimator__table">
        <tr>
          <th>Service Name</th>
          <th>Transit Time</th>
          <th>Delivery Time</th>
          <th>FedEx Price</th>
          <th>Your Cost</th>
        </tr>
    `;

    // Loop through the rates array to add rows dynamically
    data.rates.forEach((rate) => {
      let equalizedRate =
        rate.service_name === 'Freight Equalization' ? 'equalized' : '';
      serviceOptionsTable += `
        <tr>
          <td 
          class="${equalizedRate}"
          >${rate.service_name || 'N/A'}</td>
          <td class="${equalizedRate}">${rate.transit_time || 'N/A'}</td>
          <td class="${equalizedRate}">${
        new Date(rate.delivery_time.slice(5)).toDateString() || 'N/A'
      }</td>
          <td class="${equalizedRate}">${
        rate.fedex_price ? rate.fedex_price.toFixed(2) : 'N/A'
      }</td>
          <td class="your-cost ${equalizedRate}">${
        rate.your_cost ? rate.your_cost.toFixed(2) : 'N/A'
      }</td>
        </tr>
      `;
    });

    serviceOptionsTable += '</table>';

    // Append the table to the container
    serviceOptionsSection.innerHTML = serviceOptionsTable;
    $results.appendChild(serviceOptionsSection);
  }
}

customElements.define('freight-form', FreightForm);
