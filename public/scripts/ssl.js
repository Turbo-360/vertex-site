(function(){
	var url = window.location.href
	if (url.indexOf('https://') != -1)
		return

	if (url.indexOf('localhost') != -1)
		return

	// redirect to ssl version
	window.location.href = 'https://www.vertex360.co'+window.location.pathname
})()
