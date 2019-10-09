(function(){
    var preloaded = window.__PRELOADED__
    var currentUser = preloaded.user // null if not registered

    if (preloaded.ip == null)
        return

    // this is the callback function from the getRequest below ("countryip" parameter)
    window.countryip = function(payload){
        // console.log('COUNTRY IP: ' + JSON.stringify(payload))
        // COUNTRY IP: {"name":"India","country":"IN","ip":"14.195.255.255","country_3":"IND"}

        if (payload.country == null)
            return
        
        window.countryCode = payload.country.toLowerCase()
		var msg = {action:'country-code-identified', data:null}
        window.postMessage(msg, '*')
        // console.log('CC: ' + window.countryCode)
    }

    var getRequest = function(url, params, completion){
        $.ajax({
            url: url,
            type: 'GET',
            data: params,
            dataType: 'jsonp',
            jsonp: 'countryip',
            success: function(response){
                completion(null, response)
            },
            error: function(response){
                // completion(response, null)
            }
        })
    }

    // getRequest('https://get.geojs.io/v1/ip/country/14.195.255.255.js', null, function(err, response){
    getRequest('https://get.geojs.io/v1/ip/country/'+preloaded.ip+'.js', null, function(err, response){
        if (err){
            console.log('ERR: ' + JSON.stringify(err))
            return
        }

        // no callback needed here. we use jsonp which automically
        // wraps payload in callback function (see line 29)
    })
  })()