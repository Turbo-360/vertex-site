(function(){
  Mustache.tags = ["<%", "%>"] // change delimiter so it doesn't conflict server side

  var data = window.__PRELOADED__
  var templates = data.templates // this is an array
  var selected = data.selected
  var user = data.user

  // the following 2 click handlers need to be added to any new page as well:
  $('#nav-login').click(function(){
    $('#tab-login').click()
  })

  $('#btn-login').click(function(){
    $('#tab-register').click()
  })

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

  // checks if a template is ready when cloning:
  var checkTemplate = function(siteSlug){
    var body = {template:siteSlug}
    postRequest('/account/check-template', body, function(err, response){
      if (err){
        console.log('TEMPLATE NOT READY: ')
        setTimeout(function(){
          checkTemplate(siteSlug)
        }, 4000)
        return
      }

      // console.log('CHECK TEMPLATE: ' + JSON.stringify(response))
      if (response.confirmation != 'success'){
        alert('Error - ' + response.message)
        return
      }

      window.location.href = '/me?selected=sites' // redirect to account page
    })
  }

  var launchTemplate = function(){
    if (user == null){
      alert('Please log in or register to clone this site.')
      return
    }

    var body = {
      name: $('#input-site-name').val().trim(), // this needs to be entered by the user,
      source: selected.id // ID of the template being copied
      // source: template.id // ID of the template being copied
    }

    if (body.name.length == 0){
      alert('Please enter a name for your site')
      return
    }

    $('#btn-launch-container').html("<img style='width:100px' src='https://storage.turbo360.co/vertex360-cms-4hujkc/loader.gif' /><br /><em style='color:#888'>Launching your site. This may take up to 2 minutes...</em>")
    postRequest('/account/launch-template', body, function(err, response){
      if (err){
        alert('Error: ' + err.message)
        return
      }

    // console.log('SITE LAUNCHED: ' + JSON.stringify(response))
      setTimeout(function(){
        checkTemplate(response.data.slug)
      }, 4000)
    })
  }

  if (user == null){
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
  }
  else {
    $('#login-container').html('<a href="/me" class="button">My Account</a>')
    $('#nav-menu').addClass('right-side-loggedin')
    $('#nav-login').hide()
  }


  var reloadUI = function(){
    $('#selected-template-container').animate({
       scrollTop: 0
    }, 'slow');

    if (selected == null){
      var tpl = $('#tpl-how-it-works').html()
      $('#selected-template').html(Mustache.render(tpl, null))
      return
    }

    var tpl = $('#tpl-selected-template').html()
    $('#selected-template').html(Mustache.render(tpl, selected))

    if (user == null){
      return
    }

    $('#btn-launch-template').click(function(event){
      if (event)
        event.preventDefault()

      var tpl = $('#tpl-launch-template').html()
      $('#modal-container').html(tpl)
      $('#btn-clone-template').click(function(event){
        if (event)
          event.preventDefault()

        launchTemplate()
      })

      document.getElementById('btn-show-modal').click()
    })
  }

  $('.template-preview').each(function(i, el){
    $(this).click(function(event){
      if (event)
        event.preventDefault()

      var template = templates[this.id]
      if (selected == null){
        selected = template
        reloadUI()
      }
      else if (template.id == selected.id){ // already selected
        return
      }
      else {
        selected = template
        reloadUI()
      }
    })
  })

  $('#nav-how-it-works').click(function(event){
    if (event)
      event.preventDefault()

    selected = null
    reloadUI()
  })

  reloadUI()
})()
