(function(){
  var data = window.__PRELOADED__
  if (data.user != null)
    return

  if (data.referrer != null){ // referrer already set from previous session
    // console.log('REFERRER: ' + data.referrer)
    return
  }

  $.ajax({
    url: '/account/set-referrer',
    type: 'POST',
    data: {referrer: document.referrer},
    success: function(resp){
      // console.log('REFERRER SET: ' + JSON.stringify(resp))

    },
    error: function(){

    }
  })
})()
