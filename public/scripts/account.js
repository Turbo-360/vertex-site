(function(){
  Mustache.tags = ["<%", "%>"] // change delimiter so it doesn't conflict server side

  var data = window.__PRELOADED__
  var user = data.user
  var query = data.query // query params
  var selected = data.selected
  var sidebarMenu = ['list-item-profile', 'list-item-sites']

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

  var turbo = Turbo({site_id: '5c244564231ff10015a113ea'})
  $('#profile-image').click(function(event){
    if (user == null)
      return

    turbo.uploadFile({
      apiKey: '16874eb4-417b-4147-9657-18a4a2c8cada',
      completion: function(err, file){
        console.log('File Uploaded: ' + JSON.stringify(file))
        // File Uploaded: {"confirmation":"success",
        // "result":{"site":"5c244564231ff10015a113ea","name":"mongo-import.png",
        // "type":"image/png","url":"https://lh3.googleusercontent.com/NEzXrVmiEOrz0ckn37U3nj54sVmtdUGGjoIerWHh6UTd_ndtiiopnABgQxrQ8Lh9_A6SoYds9hDrasCHOM2boCBLadc","size":30826,"timestamp":"2019-01-21T18:24:14.328Z","schema":"blob","id":"5c460e4eac836700155c3b2e"}}

        var imageUrl = file.result.url+'=s512-c'
        $('#profile-image').attr('src', imageUrl)

        var updatedProfile = {
          id: user.id,
          image: file.result.url
        }

        postRequest('/account/update', updatedProfile, function(err, response){
          if (err){
            alert('Error - ' + err.message)
            return
          }

          if (response.confirmation != 'success'){
            alert('Error - ' + response.message)
            return
          }

          alert('Profile Successfully Updated')
        })
      }
    })
  })

  var reloadUI = function(){
    if (selected == 'profile'){
      $('#content-sites').css('display', 'none')
      $('#content-profile').css('display', '')
      // $('#create-template-form').css('display', 'none')
      // $('#profile-card').css('display', '')
    }

    if (selected == 'sites'){
      $('#content-profile').css('display', 'none')
      $('#content-sites').css('display', '')
      // $('#create-template-form').css('display', '')
      // $('#profile-card').css('display', 'none')
    }

    sidebarMenu.forEach(function(listItem){
      var selectedListItem = 'list-item-'+selected
      if (listItem == selectedListItem)
        $('#'+listItem).addClass('active')
      else
        $('#'+listItem).removeClass('active')
    })
  }

  $('.sidebar-menu-option').each(function(i, el){
    $(this).click(function(event){
      if (event)
        event.preventDefault()

      // console.log('TEST: ' + event.target.text)
      selected = event.target.text.trim().toLowerCase()
      reloadUI()
    })
  })

  $('#login-container').html('<a href="/me" class="button">My Account</a>')
  $('#btn-update-profile').click(function(event){
    if (event)
      event.preventDefault()

    if (user == null)
      return

    var updatedProfile = {
      id: user.id,
      firstName: $('#input-profile-firstName').val().trim().toLowerCase(),
      lastName: $('#input-profile-lastName').val().trim().toLowerCase(),
      username: $('#input-profile-username').val().trim(),
      bio: $('#input-profile-bio').val(),
      tags: $('#input-profile-tags').val().trim().toLowerCase()
    }

    postRequest('/account/update', updatedProfile, function(err, response){
      if (err){
        alert('Error - ' + err.message)
        return
      }

      if (response.confirmation != 'success'){
        alert('Error - ' + response.message)
        return
      }

      alert('Profile Successfully Updated')
    })
  })

  reloadUI()
  $('#btn-create-template').click(function(event){
    if (event)
      event.preventDefault()

    var template = {
      name: $('#input-template-name').val(),
      description: $('#input-template-description').val(),
      category: $('#input-template-category').val()
    }

    if (template.name.length == 0){
      alert('Please enter a template NAME.')
      return
    }

    postRequest('/account/createtemplate', template, function(err, response){
      if (err){
        alert('Error - ' + err.message)
        return
      }

      if (response.confirmation != 'success'){
        alert('Error - ' + response.message)
        return
      }

      // console.log('CREATE TEMPLATE: ' + JSON.stringify(response))
      window.location.href = '/admin/'+response.data.slug
    })
  })

  $('#btn-update-password').click(function(event){
    if (event)
      event.preventDefault()

    var pw1 = $('#input-password-1').val()
    var pw2 = $('#input-password-2').val()
    if (pw1.length==0 || pw2.length==0){
      alert('Please complete both fields')
      return
    }

    if (pw1 != pw2){
      alert('Passwords do not match')
      return
    }

    postRequest('/account/resetpassword', {password:pw1, user:user.id}, function(err, response){
      if (err){
        alert('Error - ' + err.message)
        return
      }

      if (response.confirmation != 'success'){
        alert('Error - ' + response.message)
        return
      }

      alert('Password Successfully Reset')
      $('.mfp-close')[0].click()
    })
  })

  $('#link-logout').click(function(event){
    if (event)
      event.preventDefault()

    // console.log('LOGOUT!')
    var auth2 = gapi.auth2.getAuthInstance()
    if (auth2 == null){
      window.location.href = '/account/logout'
      return
    }

    auth2.signOut().then(function(){
      window.location.href = '/account/logout'
    })
  })

  if (query == null)
    return

  if (query.resetpassword == null)
    return

  setTimeout(function(){
    document.getElementById('btn-change-pw').click()
  }, 1000)
})()
