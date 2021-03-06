(function(){
  var data = window.__PRELOADED__
  if (!data)
    return

  var loaderUrl = 'https://storage.turbo360.co/vertex360-cms-4hujkc/loader.gif'
  var userAgent = navigator.userAgent.toLowerCase()
  // console.log('USER AGENT: ' + userAgent) // USER AGENT: mozilla/5.0 (macintosh; intel mac os x 10_13_4) applewebkit/537.36 (khtml, like gecko) chrome/76.0.3809.100 safari/537.36
  var isMobile = (userAgent.includes('iphone')==true || userAgent.includes('android')==true)

  var user = data.user
  var onLoginRedirect = data.onLoginRedirect || '/me'
  var onRegisterRedirect = data.onRegisterRedirect || '/templates'

  if (user != null){
    $('#login-container').html('<a href="/me" class="nav-link btn btn-primary text-white hidden-xs">My Account</a>')
    $('#nav-menu').addClass('right-side-loggedin')
    $('#nav-login').hide()
    return
  }

  function validateEmail(email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(email).toLowerCase())
  }

  var authorizeUser = function(redirect, data){
    if (redirect == 'reload'){
      window.location.reload()
      return
    }

    window.location.href = redirect
  }

  $('#btn-logout').click(function(){
    if (event)
      event.preventDefault()

    $('#btn-logout-container').html("<img style='width:40px' src='" + loaderUrl + "' />")
    parent.postMessage({action:'log-out', data:null}, '*')
  })

  $('#input-register').click(function(event){
    if (event)
      event.preventDefault()

    var visitor = {
      fullName: $('#input-register-name').val(),
      email: $('#input-register-email').val(),
      password: $('#input-register-password').val()
    }

    if (visitor.email.length == 0){
      alert('Please enter your EMAIL')
      return
    }

    // validate email string:
    if (validateEmail(visitor.email) != true){
      alert('Please enter a VALID EMAIL')
      return
    }

    if (visitor.password.length == 0){
      alert('Please enter your PASSWORD')
      return
    }

    $('#input-register-container').html("<img style='width:80px' src='" + loaderUrl + "' />")
    window.vertexLib.postRequest('/account/register', visitor, function(err, response){
      if (err){
        alert(err.message)
        return
      }

      if (response.confirmation != 'success'){
        alert(response.message)
        return
      }

      if (data.isWidget){
        // send message back to parent container (react bundle) so
        // user auth can be handled on individual site domains:
        parent.postMessage({action:'logged-in', data:response.user}, '*')
        return
      }

      authorizeUser(onRegisterRedirect)

      /*
      if (gapi==null){
        authorizeUser(onRegisterRedirect)
        return
      }


      if (gapi.auth2==null){
        authorizeUser(onRegisterRedirect)
        return
      }

      // log out of google if logged in:
      var auth2 = gapi.auth2.getAuthInstance()
      if (auth2 == null){
        authorizeUser(onRegisterRedirect)
        return
      }

      auth2.signOut().then(function () {
        authorizeUser(onRegisterRedirect)
      })
      */
    })
  })

  var bindLoginHandler = function(){
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

      // validate email string:
      if (validateEmail(visitor.email) != true){
        alert('Please enter a VALID EMAIL')
        return
      }

      if (visitor.password.length == 0){
        alert('Please enter your PASSWORD')
        return
      }
      var btnLogin = $('#input-login-container').html()
      $('#input-login-container').html("<img style='width:80px' src='" + loaderUrl + "' />")
      window.vertexLib.postRequest('/account/login', visitor, function(err, response){
        if (err){
          $('#input-login-container').html(btnLogin)
          setTimeout(function(){
            bindLoginHandler()
          }, 500)
          alert(err.message)
          return
        }

        if (response.confirmation != 'success'){
          $('#input-login-container').html(btnLogin)
          setTimeout(function(){
            bindLoginHandler()
          }, 500)
          alert(response.message)
          return
        }

        if (data.isWidget){
          // send message back to parent container (react bundle) so
          // user auth can be handled on individual site domains:
          parent.postMessage({action:'logged-in', data:response.user}, '*')
          return
        }

        authorizeUser(onLoginRedirect, response)
      })
    })
  }

  bindLoginHandler()

})();
