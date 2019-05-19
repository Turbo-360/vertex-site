(function(){
  var data = window.__PRELOADED__
  if (data.stripe==null)
    return

  var stripeStyle = {
    base: {
      color: '#32325d',
      lineHeight: '18px',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }

  var stripeMgr = Stripe(data.stripe)
  var card = stripeMgr.elements().create('card', {style: stripeStyle}) // Create an instance of the card Element.
  card.mount('#card-element') // Add an instance of the card Element into the `card-element` <div>.

  // Handle real-time validation errors from the card Element.
  card.addEventListener('change', function(event){
    var displayError = document.getElementById('card-errors')
    displayError.textContent = (event.error) ? event.error.message : ''
  })

  $('#input-register-premium').click(function(event){
    if (event)
      event.preventDefault()

    // const cardData = {
    // 	name: (currentUser==null) ? visitor.fullName.trim() : currentUser.firstName+' '+currentUser.lastName,
    // 	email: (currentUser==null) ? visitor.email.trim() : currentUser.email,
    // 	address_line1: visitor.address_line1.trim(),
    // 	address_city: visitor.address_city.trim(),
    // 	address_country: visitor.address_country.trim()
    // }

    var visitor = {
      // name: $('#input-premium-email').val(),
      email: $('#input-premium-email').val().trim(),
      address_line1: $('#input-address-street').val().trim(),
      address_city: $('#input-address-city').val().trim(),
      address_country: $('#input-address-country').val().trim()
    }

    console.log('PREMIUM Register: ' + JSON.stringify(visitor))
    if (visitor.email.length == 0){
      alert('Please enter your EMAIL')
      return
    }

    // if (TextUtils.validateEmail(visitor.email) == false){
    // 	alert('Please enter a valid EMAIL')
    // 	return
    // }

    if (visitor.password.length == 0){
      alert('Please enter your PASSWORD')
      return
    }

    if (visitor.address_line1.length == 0){
      alert('Please enter your ADDRESS')
      return
    }

    if (visitor.address_city.length == 0){
      alert('Please enter your CITY')
      return
    }

    stripe.createToken(card, visitor)
		.then(result => {
			if (result.error) { // Inform the user if there was an error.
				const errorElement = document.getElementById('card-errors')
				errorElement.textContent = result.error.message
				// this.setState({isLoading: false})
				return
			}

			// this.setState({isLoading: false})
			// console.log('TOKEN: ' + JSON.stringify(result.token))
			// {"id":"tok_1CqvUVC5b8QCRB75CopRXyHn","object":"token",
			// "card":{"id":"card_1CqvUUC5b8QCRB75sGSv518b","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":"10003","address_zip_check":"unchecked","brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":3,"exp_year":2022,"funding":"debit","last4":"6856","metadata":{},"name":null,"tokenization_method":null},"client_ip":"74.71.60.50","created":1532319467,"livemode":false,"type":"card","used":false}

			// Send the token to your server.
			// this.props.submitCallback(result.token, visitor)
      var token = result.token
      var params = {
  			stripeToken: token.id,
  			email: token.email,
  			name: token.card.name,
  			description: 'Vertex Pro Member'
  		}

      $.ajax({
        url: '/account/create-stripe-customer',
        type: 'POST',
        data: params,
        success: function(response){
          alert('SUCCESS - ' + JSON.stringify(response))
        },
        error: function(request, err){
          alert('ERROR - ' + JSON.stringify(request))
        }
      })

			return
		})
		.catch(err => {
			console.log('ERROR: ' + err.message)
		})
  })
})()
