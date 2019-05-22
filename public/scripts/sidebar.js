(function(){
  var data = window.__PRELOADED__
  var user = data.user

  if (user != null) // user already logged in
    return

  var postRequest = function(url, params, completion){
    $.ajax({
      url: url,
      type: 'POST',
      data: params,
      success: function(response){
        completion(null, response)
      },
      error: function(response){
        completion(response, null)
      }
    })
  }

  $('#btn-sidebar-login').click(function(event){
    if (event)
      event.preventDefault()

    var visitor = {
      email: $('#input-sidebar-email').val(),
      password: $('#input-sidebar-password').val()
    }

    if (visitor.email.length == 0){
      alert('Please enter your EMAIL')
      return
    }

    if (visitor.password.length == 0){
      alert('Please enter your PASSWORD')
      return
    }

    // console.log('LOGIN: ' + JSON.stringify(visitor))
    postRequest('/account/login', visitor, function(err, response){
      if (err){
        alert('Error - ' + err)
        return
      }

      if (response.confirmation != 'success'){
        alert('Error - ' + response.message)
        return
      }

      window.location.href = '/me'
    })
  })

  $('#btn-sidebar-register').click(function(event){
    if (event)
      event.preventDefault()

    var visitor = {
      email: $('#input-sidebar-email').val(),
      password: $('#input-sidebar-password').val()
    }

    if (visitor.email.length == 0){
      alert('Please enter your EMAIL')
      return
    }

    if (visitor.password.length == 0){
      alert('Please enter your PASSWORD')
      return
    }

    // console.log('REGISTER: ' + JSON.stringify(visitor))
    postRequest('/account/register', visitor, function(err, response){
      if (err){
        alert('Error - ' + err)
        return
      }

      if (response.confirmation != 'success'){
        alert('Error - ' + response.message)
        return
      }

      window.location.href = '/me'
    })
  })
})()
