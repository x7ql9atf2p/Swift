function createAccount(username) {
  return fetch('/api/new', {
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
      return data.token;
    } else {
      throw new Error('Account creation failed or token missing.');
    }
  })
  .catch(error => {
    console.error('Error creating account:', error);
    return null;
  });
}

setTimeout(function() {
  console.log(createAccount)
}, 5000)
