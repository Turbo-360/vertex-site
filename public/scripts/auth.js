(function(){
  var data = window.__PRELOADED__
  if (!data)
    return

  var user = data.user

  if (user != null){
    $('#login-container').html('<a href="/me" class="nav-link btn btn-primary text-white hidden-xs">My Account</a>')
    $('#nav-menu').addClass('right-side-loggedin')
    $('#nav-login').hide()
    return
  }

  $('#input-register').click(function(event){
    if (event)
      event.preventDefault()

    var visitor = {
      fullName: $('#input-register-name').val(),
      email: $('#input-register-email').val(),
      password: $('#input-register-password').val()
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

      window.location.href = '/me'
    })
  })

  $('#input-login').click(function(event){
    if (event)
      event.preventDefault()

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

      window.location.href = '/me'
    })
  })

})();
