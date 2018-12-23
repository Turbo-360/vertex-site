/* Your custom app logic goes here */

(function(){
  Mustache.tags = ["<%", "%>"] // change delimiter so it doesn't conflict server side

  const data = window.__PRELOADED_DATA__
  const templates = data.templates
  var selected = data.selected

  var reloadUI = function(){
    const templatesList = templates[selected]

    var html = '<ol>'
    var template = $('#tpl-list-item-template').html()
    templatesList.forEach(function(summary, i){
      console.log('SUMMARY: ' + JSON.stringify(summary))
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
