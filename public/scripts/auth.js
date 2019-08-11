(function(){
  var data = window.__PRELOADED__
  if (!data)
    return

  var user = data.user
  var onLoginRedirect = data.onLoginRedirect || '/me'
  var onRegisterRedirect = data.onRegisterRedirect || '/templates'

  if (user != null){
    $('#login-container').html('<a href="/me" class="nav-link btn btn-primary text-white hidden-xs">My Account</a>')
    $('#nav-menu').addClass('right-side-loggedin')
    $('#nav-login').hide()
    return
  }

  var authorizeUser = function(redirect){
    if (redirect == 'reload'){
      window.location.reload()
      return
    }

    window.location.href = redirect
  }

  $('#input-register').click(function(event){
    if (event)
      event.preventDefault()

    var visitor = {
      fullName: $('#input-register-name').val(),
      email: $('#input-register-email').val(),
      password: $('#input-register-password').val(),
      promoCode: $('#input-register-promo').val()
    }

    if (visitor.fullName.length == 0){
      alert('Please enter your NAME')
      return
    }

    if (visitor.email.length == 0){
      alert('Please enter your EMAIL')
      return
    }

    if (visitor.password.length == 0){
      alert('Please enter your PASSWORD')
      return
    }

    window.vertexLib.postRequest('/account/register', visitor, function(err, response){
      if (err){
        alert(err.message)
        return
      }

      // log out of google if logged in:
      var auth2 = gapi.auth2.getAuthInstance()
      if (auth2 == null){
        authorizeUser(onRegisterRedirect)
        // window.location.href = onRegisterRedirect
        return
      }

      auth2.signOut().then(function () {
        authorizeUser(onRegisterRedirect)
        // window.location.href = onRegisterRedirect
      })
    })
  })

  $('#input-login').click(function(event){
    if (event)
      event.preventDefault()

    if (user != null){
      window.location.href = '/me'
      return
    }

    var visitor = {
      email: $('#input-login-email').val().trim(),
      password: $('#input-login-password').val().trim()
    }

    if (visitor.email.length == 0){
      alert('Please enter your EMAIL')
      return
    }

    if (visitor.password.length == 0){
      alert('Please enter your PASSWORD')
      return
    }

    window.vertexLib.postRequest('/account/login', visitor, function(err, response){
      if (err){
        alert(err.message)
        return
      }

      // log out of google if logged in:
      var auth2 = gapi.auth2.getAuthInstance()
      if (auth2 == null){
        authorizeUser(onLoginRedirect)
        // window.location.href = onLoginRedirect
        return
      }

      auth2.signOut().then(function () {
        authorizeUser(onLoginRedirect)
        // window.location.href = onLoginRedirect
      })
    })
  })

})();
