// const Promise = require('bluebird')

module.exports = {
	addCustomer: (params, stripeKey) => {
		return new Promise((resolve, reject) => {
			const stripeToken = params.stripeToken
			if (stripeToken == null){
				reject(new Error('Missing stripeToken parameter'))
				return
			}

			if (params.name != null){
				const parts = params.name.split(' ')
				params['firstName'] = parts[0]
				if (parts.length > 1)
					params['lastName'] = parts[parts.length-1]
			}

			const stripe = require('stripe')(stripeKey)
			stripe.customers.create({
				// description: (params.description==null) ? params.email : params.email + ', ' + params.description,
				description: params.description || params.email,
				source: stripeToken
			}, (err, customer) => {
				if (err){
					reject(err)
					return
				}

				// check for the card
				if (customer.sources.data.length == 0){
					reject(new Error('Customer creation failed.'))
					return
				}

				const card = customer.sources.data[0]
				const data = {
					customer: {
						id: customer.id,
						email: params.email,
						name: params.name,
						firstName: params.firstName,
						lastName: params.lastName
					},
					card: {
						lastFour: card.last4,
						exp_month: card.exp_month,
						exp_year: card.exp_year,
						brand: card.brand
					}
				}

				resolve(data)
				return
			})
		})
	},

	processCharge: (params, stripeKey) => {
		return new Promise((resolve, reject) => {
			const stripeToken = params.stripeToken
			if (stripeToken == null){
				reject(new Error('Missing stripeToken parameter'))
				return
			}

			if (params.amount == null){
				reject(new Error('Missing amount parameter'))
				return
			}

			if (params.name != null){
				const parts = params.name.split(' ')
				params['firstName'] = parts[0]
				if (parts.length > 1)
					params['lastName'] = parts[parts.length-1]
			}


			const description = params.description || ''
			const stripe = require('stripe')(stripeKey)
			stripe.charges.create({
				amount: params.amount * 100, // convert amount to cents
				currency: 'usd',
				source: stripeToken,
				description: description,
			}, (err, charge) => {
				if (err){
		            reject(err)
		            return
				}

				const data = {
					charge: charge,
					customer: {
						email: params.email,
						name: params.name,
						firstName: params.firstName,
						lastName: params.lastName
					}
				}

		    	resolve(data)
			})
		})
	}

}
