(function(){
  var data = window.__PRELOADED__
  var user = data.user

  var postRequest = function(url, data, completion){
    $.ajax({
      url: url,
      type: 'POST',
      data: data,
      success: function(response, status, xhr){
        if (response.confirmation != 'success'){
          completion(response, null) // 'data' is the error object here.
          return
        }

        completion(null, response)
      },
      error: function(xhr, status, err){
        completion(err, null)
      }
    })
  }

  if (user != null){
    $('#login-container').html('<a href="/me" class="button">My Account</a>')
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

    postRequest('/account/register', visitor, function(err, response){
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
      email: $('#input-login-email').val(),
      password: $('#input-login-password').val()
    }

    if (visitor.email.length == 0){
      alert('Please enter your EMAIL')
      return
    }

    if (visitor.password.length == 0){
      alert('Please enter your PASSWORD')
      return
    }

    postRequest('/account/login', visitor, function(err, response){
      if (err){
        alert(err.message)
        return
      }

      window.location.href = '/me'
    })
  })

})()
