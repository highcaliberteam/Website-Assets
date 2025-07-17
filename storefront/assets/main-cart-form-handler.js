document.addEventListener('DOMContentLoaded', function () {
  const cartItemsInput = document.getElementById('cartItems');
  const productList = document.getElementById('productList');
  const messageList = document.getElementById('cart-form__message');

  // Fetch cart data
  fetch('/cart.js')
    .then((response) => response.json())
    .then((cart) => {
      if (cart && cart.items && cart.items.length > 0) {
        console.log(cart);
        const latestItem = cart.items[0];
        cartItemsInput.value = JSON.stringify([latestItem]);

        productList.innerHTML = '';
        const productItem = document.createElement('div');
        productItem.classList.add('product-item');
        productItem.innerHTML = `<span>${latestItem.title}</span>`;
        productList.appendChild(productItem);

        fetch('/cart/clear.js', { method: 'POST' })
          .then(() =>
            fetch('/cart/add.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: latestItem.variant_id,
                quantity: latestItem.quantity,
              }),
            })
          )
          .catch((error) => {
            console.error('Error updating cart:', error);
          });
      } else {
        cartItemsInput.value = '[]';
      }
    })
    .catch((error) => {
      console.error('Error fetching cart data:', error);
    });

  document
    .getElementById('customerForm')
    .addEventListener('submit', function (event) {
      event.preventDefault();

      const formData = new FormData(this);
      const object = {};
      formData.forEach(function (value, key) {
        object[key] = value;
      });
      const json = JSON.stringify(object);

      fetch(
        'https://create-a-flyer-hcl-6c80e98a5482.herokuapp.com/apps/make-an-offer',
        {
          method: 'POST',
          body: json,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
        .then((response) => {
          if (response.ok) {
            messageList.innerHTML = 'Form submitted successfully!';
            document.getElementById('customerForm').reset();
            document.getElementById('productList').innerHTML = '';
          } else {
            return response.text().then((text) => {
              throw new Error(text);
            });
          }
        })
        .catch((error) => {
          console.error('Error:', error);
          messageList.innerHTML =
            'There was an error submitting the form. Please try again.';
        });
    });
});
