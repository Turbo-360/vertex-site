/* Your custom app logic goes here */

(function(){
  Mustache.tags = ["<%", "%>"] // change delimiter so it doesn't conflict server side

  const data = window.__PRELOADED_DATA__
  const templates = data.templates
  var selected = data.selected

  var fetchTemplates = function(category){
    // console.log('Fetch templates: ' + category)
    $.ajax({
      url: '/api/site?template.status=live&template.category='+category,
      type: 'GET',
      data: null,
      success: function(response, status, xhr){
        console.log(JSON.stringify(response))
        if (response.confirmation != 'success'){
          alert(response.message)
          return
        }

        templates[category] = response.results
        reloadUI()
      },
      error: function(xhr, status, err){
        alert(err.message)
      }
    })
  }

  var reloadUI = function(){
    const templatesList = templates[selected]
    if (templatesList == null){
      fetchTemplates(selected)
      return
    }

    var html = '<ol>'
    var template = $('#tpl-list-item-template').html()
    templatesList.forEach(function(summary, i){
      html += Mustache.render(template, summary)
    })

    html += '</ol>'
    $('#templates').html(html)
  }

  $('.category-link').each(function(i, link){
    $(this).click(function(event){
      if (event)
        event.preventDefault()

      selected = $(this).html()
      reloadUI()
    })
  })

  reloadUI()
})()
