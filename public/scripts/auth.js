(function(){
  var data = window.__PRELOADED__
  var user = data.user

  if (user != null){
    $('#login-container').html('<a href="/me" class="button">My Account</a>')
    $('#nav-menu').addClass('right-side-loggedin')
    $('#nav-login').hide()
  }
})()
