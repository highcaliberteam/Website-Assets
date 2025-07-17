class OrderLookup extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.form = this.querySelector('form') || this;
    this.wrapper = this.querySelector('.order-lookup-form__wrapper');
    this.orderDetails = this.querySelector('#order-details');
    this.submit = this.querySelector('button[type="submit"]');

    this.submit.addEventListener('click', this.handleSubmit.bind(this));
  }

  handleSubmit(event) {
    event.preventDefault();

    const orderNumber = this.querySelector('#order-number').value;
    const postalCode = this.querySelector('#postal-code').value;
    const now = Date.now();
    const sectionURL = `/?section_id=order-lookup-section&order_number=${orderNumber}&postal_code=${postalCode}&view=${now}`;

    fetch(sectionURL)
      .then((response) => {
        if (!response.ok) {
          console.log('Failed to fetch the order details');
          return;
        }
        return response.text();
      })
      .then((htmlText) => {
        if (!htmlText) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const orderDetailsSection = doc.querySelector('#order-details-section');

        if (orderDetailsSection) {
          this.orderDetails.innerHTML = orderDetailsSection.innerHTML;
          this.orderDetails.style.display = 'block';
          this.orderDetails.scrollIntoView({ behavior: 'smooth' });
          this.showBackToSearchButton();
        } else {
          console.log('Order not found or postal code mismatch');
        }
      })
      .catch((error) => {
        console.error('Error fetching order details:', error);
      });
  }

  showBackToSearchButton() {
    console.log('Showing back to search button');
    const backButton = document.createElement('button');
    backButton.textContent = 'Back to Search';
    backButton.classList.add('button');
    backButton.classList.add('button--full-width');
    backButton.addEventListener('click', () => {
      window.location.reload(); // Refresh the page
    });

    console.log('backButton');

    // Replace the form with the button
    this.wrapper.replaceWith(backButton);
  }
}

customElements.define('order-lookup', OrderLookup);
