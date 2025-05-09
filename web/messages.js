function createAccount(username, callback) {
  fetch('/api/new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      authentication: 'examplepassword'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.token) {
      callback(data.token);
    } else {
      console.error('Account creation failed or token missing.');
      callback(null);
    }
  })
  .catch(error => {
    console.error('Error creating account:', error);
    callback(null);
  });
}
