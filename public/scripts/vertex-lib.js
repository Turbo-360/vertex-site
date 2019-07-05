var vertexLib = {
  postRequest: function(url, params, completion){
    $.ajax({
      url: url,
      type: 'POST',
      data: params,
      success: function(response){
        if (response.confirmation != 'success'){
          completion(response, null)
          return
        }

        completion(null, response)
      },
      error: function(response){
        completion(response, null)
      }
    })
  },

  getRequest: function(url, params, completion){
    $.ajax({
      url: url,
      type: 'GET',
      data: params,
      success: function(response){
        if (response.confirmation != 'success'){
          completion(response, null)
          return
        }

        completion(null, response)
      },
      error: function(response){
        completion(response, null)
      }
    })
  }
}

window.vertexLib = vertexLib
