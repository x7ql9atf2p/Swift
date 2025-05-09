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
      console.error('Account creation failed:', data.error || 'Unknown error');
      callback(null);
    }
  })
  .catch(error => {
    console.error('Error creating account:', error);
    callback(null);
  });
}

function authenticate(username, token, callback) {
  fetch('/api/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      token: token
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success === true) {
      callback(true);
    } else {
      console.warn('Authentication failed:', data.error || 'Invalid credentials');
      callback(false);
    }
  })
  .catch(error => {
    console.error('Error authenticating:', error);
    callback(false);
  });
}
