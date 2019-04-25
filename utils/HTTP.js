var superagent = require('superagent')
// var Promise = require('bluebird')

module.exports = {
	validateParams: function(req, required){
		if (required == null){
			return {
				confirmation: 'fail',
				message: 'Missing required array'
			}
		}

		var params = req.body
		if (params == null){
			return {
				confirmation: 'fail',
				message: 'Missing parameters'
			}
		}

		var missing = null
		required.forEach(function(param, i){
			if (params[param] == null)
				missing = param
		})

		if (missing != null){
			return {
				confirmation: 'fail',
				message: 'Missing '+missing+' parameter.'
			}
		}

		return {
			confirmation: 'success',
			params: params
		}
	},

	get: function(endpoint, params){
		return new Promise(function(resolve, reject){
			superagent
			.get(endpoint)
			.query(params)
			// .set('Accept', 'application/json')
			.end(function(err, res) {
				if (err){
					reject(err)
					return
				}

				const payload = res.text || res.body
				resolve(payload)
			})
		})
	},

	post: function(endpoint, body, headers){
		return new Promise(function(resolve, reject){
			superagent
			.post(endpoint)
			.send(body)
			// .set(headers)
			.end(function(err, res) {
				if (err){
					reject(err)
					return
				}

				const payload = res.text || res.body
				resolve(payload)
			})
		})
	},

	put: function(endpoint, body){
		return new Promise(function(resolve, reject){
			superagent
			.put(endpoint)
			.send(body)
			// .set('Accept', 'application/json')
			.end(function(err, res) {
				if (err){
					reject(err)
					return
				}

				const payload = res.text || res.body
				resolve(payload)
				// resolve(res.body)
			})
		})
	},

	delete: function(endpoint){
		return new Promise(function(resolve, reject){
			superagent
			.delete(endpoint)
			// .send(body)
			.end(function(err, res) {
				if (err){
					reject(err)
					return
				}

				const payload = res.text || res.body
				console.log('PAYLOAD: ' + payload)
				resolve(payload)
			})
		})
	}

}
