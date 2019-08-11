function onRegisterSuccess(googleUser){
  var data = window.__PRELOADED__
  if (data.user != null) // already signed in
    return

  var now = Date.now()
  var delta = now-data.timestamp
  if (delta < 5000)
    return

  var onRegisterRedirect = data.onRegisterRedirect || '/templates'

  var profile = googleUser.getBasicProfile()
  console.log('Logged in as: ' + profile.getName())
  console.log('Name: ' + profile.getName())
  console.log('Email: ' + profile.getEmail()) // This is null if the 'email' scope is not present.

  var googleRegisterProfile = {
    auth: 'register',
    fullName: profile.getName(),
    email: profile.getEmail().toLowerCase()
  }

  window.vertexLib.postRequest('/account/googleauth', googleRegisterProfile, function(err, response){
    if (err){
      alert(err.message)
      return
    }

    // window.location.href = '/me'
    if (onRegisterRedirect == 'reload'){
      window.location.reload()
      return
    }

    window.location.href = onLoginRedirect
  })
}

function onLoginSuccess(googleUser){
  var data = window.__PRELOADED__
  if (data.user != null) // already signed in
    return

  var now = Date.now()
  var delta = now-data.timestamp
  if (delta < 5000)
    return

  var onLoginRedirect = data.onLoginRedirect || '/me'

  var profile = googleUser.getBasicProfile()
  console.log('Login Successful: ' + profile.getName())
  console.log('Name: ' + profile.getName())
  console.log('Email: ' + profile.getEmail()) // This is null if the 'email' scope is not present.
  var googleLoginProfile = {
    auth: 'login',
    email: profile.getEmail().toLowerCase()
  }

  window.vertexLib.postRequest('/account/googleauth', googleLoginProfile, function(err, response){
    if (err){
      alert(err.message)
      return
    }

    if (onLoginRedirect == 'reload'){
      window.location.reload()
      return
    }

    // window.location.href = '/me'
    window.location.href = onLoginRedirect
  })
}

function onFailure(error) {
  console.log(error)
}

function renderButton(){
  gapi.signin2.render('google-register', {
    'scope': 'profile email',
    'width': 265,
    'height': 50,
    'longtitle': true,
    'onsuccess': onRegisterSuccess,
    'onfailure': onFailure
  });

  gapi.signin2.render('google-login', {
    'scope': 'profile email',
    'width': 265,
    'height': 50,
    'longtitle': true,
    'onsuccess': onLoginSuccess,
    'onfailure': onFailure
  });
}
