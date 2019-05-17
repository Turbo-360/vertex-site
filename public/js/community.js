(function(){
  var data = window.__PRELOADED__
  var user = data.user
  var sidebarItems = ['forum', 'templates', 'blog']
  var isFetching = false
  var selected = 'forum' // default
  if (data.query){
    selected = data.query.selected || 'forum'
    if (sidebarItems.indexOf(selected) == -1)
      selected = 'forum'
  }

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

  var reloadUI = function(){
    $('#selected-header').html(selected.toUpperCase())
    sidebarItems.forEach(function(item){
      if (item == selected)
        $('#sidebar-'+item).addClass('active')
      else
        $('#sidebar-'+item).removeClass('active')

      if (selected == 'forum'){
        $('#container-templates').hide()
        $('#container-blog').hide()
        $('#container-forum').show()
      }

      if (selected == 'blog'){
        $('#container-templates').hide()
        $('#container-forum').hide()
        $('#container-blog').show()
      }

      if (selected == 'templates'){
        $('#container-templates').show()
        $('#container-forum').hide()
        $('#container-blog').hide()
      }

    })
  }

  sidebarItems.forEach(function(item){
    $('#sidebar-'+item).click(function(event){
      if (event)
        event.preventDefault()

      if (item == selected)
        return

      selected = item
      reloadUI()
    })
  })

  var expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
  var regex = new RegExp(expression)
  var isUrl = function(str){
    return str.match(regex) ? true : false
  }

  var scrapeUrl = function(url){
    if (isUrl(url) == false) // invalid URL
      return

    if (isFetching == true)
      return

    isFetching = true
    $.ajax({
      url: '/account/scrape?url='+url,
      type: 'GET',
      data: null,
      success: function(response){
        // console.log('SCRAPE: ' + JSON.stringify(response))
        isFetching = false
        if (response.confirmation != 'success'){
          return
        }

        var metaData = response.data
        $('#input-comment-title').val(metaData.title)

      },
      error: function(response){
        console.log('ERROR: ' + JSON.stringify(response))
        isFetching = false
      }
    })
  }

  var extractHostname = function(url) {
    var hostname = (url.indexOf("//") > -1) ? url.split('/')[2] : hostname = url.split('/')[0]
    hostname = hostname.split(':')[0] //find & remove port number
    hostname = hostname.split('?')[0] //find & remove "?"
    return hostname
  }

  if (user != null){
    $('#comment-avatar').attr('src', user.image+'=s120-c')
  }

  $('#input-comment-text').on('change keyup paste', function(){
      var text = $('#input-comment-text').val()
      if (isUrl(text) == false)
        return

      if ($('#input-comment-title').val().length > 0) // title already set
        return

      // console.log('Scrape URL: ' + text)
      scrapeUrl(text)
  })

  $('#btn-submit-comment').click(function(event){
    if (event)
      event.preventDefault()

    if (user == null){
      alert('Please log in or register to submit a comment.')
      return
    }

    var text = $('#input-comment-text').val()
    var domain = ''
    if (isUrl(text)==true)
      domain = extractHostname(text)

    var comment = {
      profile: JSON.stringify({id:user.id, firstName:user.firstName, lastName:user.lastName, username:user.username, image:user.image, slug:user.slug}),
      title: $('#input-comment-title').val(),
      text: text,
      url: (isUrl(text)==true) ? text : '',
      domain: domain
    }

    if (comment.title.length == 0){
      alert('Please enter a title for your comment')
      return
    }

    if (comment.text.length == 0){
      alert('Please enter text for your comment')
      return
    }

    if (isFetching == true)
      return

    isFetching = true
    postRequest('/api/comment', comment, function(err, response){
      if (err){
        isFetching = false
        return
      }

      if (response.confirmation != 'success'){
        alert('Error - ' + response.message)
        return
      }

      // console.log('COMMENT CREATED: ' + JSON.stringify(response))
      window.location.href = '/comments/'+response.result.slug
    })
  })

  $('.sl-icon-arrow-up').each(function(i, upvote){
    $(this).click(function(event){
      if (event)
        event.preventDefault()

      if (user == null){
        alert('Please log in or register to upvote')
        return
      }

      var parent = $(this).parent()
      var voteInfo = parent.attr('id')
      isFetching = true
      postRequest('/account/vote', {profile:user.id, comment:voteInfo}, function(err, response){
        if (err){
          isFetching = false
          return
        }

        if (response.confirmation != 'success'){
          alert('Error - ' + response.message)
          return
        }

        var data = response.data
        // console.log('VOTE: ' + JSON.stringify(data))
        $('#score-'+data.id).html(data.votes.score)
      })
    })
  })

  $('.sl-icon-arrow-down').each(function(i, downvote){
    $(this).click(function(event){
      if (event)
        event.preventDefault()

      if (user == null){
        alert('Please log in or register to downvote')
        return
      }

      var parent = $(this).parent()
      var voteInfo = parent.attr('id')
      isFetching = true
      postRequest('/account/vote', {profile:user.id, comment:voteInfo}, function(err, response){
        if (err){
          isFetching = false
          return
        }

        if (response.confirmation != 'success'){
          alert('Error - ' + response.message)
          return
        }

        var data = response.data
        // console.log('VOTE: ' + JSON.stringify(data))
        $('#score-'+data.id).html(data.votes.score)
      })
    })
  })

  reloadUI()
})()
