document
  .getElementById('product-info-form')
  .addEventListener('submit', function (event) {
    event.preventDefault();

    const spinner = document.getElementById('loading-spinner');
    spinner.querySelector('.loading__spinner').classList.remove('hidden');

    const formData = new FormData(this);
    const jsonData = {};
    formData.forEach((value, key) => {
      jsonData[key] = value;
    });

    fetch(this.action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then((data) => {
        spinner.querySelector('.loading__spinner').classList.add('hidden');
        document.getElementById('form-message').innerHTML = 'Flyer sent!';
        console.log('Success:', data);
      })
      .catch((error) => {
        spinner.querySelector('.loading__spinner').classList.add('hidden');
        console.error('Error:', error);
        document.getElementById('form-message').innerHTML =
          'There was an error sending the flyer. Please try again.';
      });
  });
