var Event = require('../models/Event')
var utils = require('../utils')

module.exports = {
	get: function(params){
		return new Promise(function(resolve, reject){
			if (params == null)
				params = {}

			var sortOrder = (params.sort == 'asc') ? 1 : -1
			delete params['sort']

			/* Query by filters passed into parameter string: */
			var limit = params.limit
			if (limit == null)
				limit = '0'

			delete params['limit']

			Event.find(params, null, {limit:parseInt(limit), sort:{timestamp: sortOrder}}, function(err, events){
				if (err){
					reject(err)
					return
				}

				resolve(utils.Resource.convertToJson(events))
			})
		})
	},

	getById: function(id, isRaw){
		return new Promise(function(resolve, reject){
			Event.findById(id, function(err, event){
				if (err){
					reject(new Error('Event ' + id + ' not found'))
					return
				}

				if (event == null){
					reject(new Error('Event ' + id + ' not found'))
					return
				}

				if (isRaw){
					resolve(event)
					return
				}

				resolve(event.summary())
			})
		})
	},

	post: function(params){
		return new Promise(function(resolve, reject){
			Event.create(params, function(err, event){
				if (err){
					reject(err)
					return
				}

				resolve(event.summary())
				return
			})
		})
	},

	put: function(id, params, token){
		return new Promise(function(resolve, reject){
			Event.findByIdAndUpdate(id, params, {new:true}, function(err, event){
				if (err){
					reject(err)
					return
				}

				resolve(event.summary())
			})
		})
	},

	delete: function(id){
		return new Promise(function(resolve, reject){
			Event.findByIdAndRemove(id, function (err){
			  if (err) {
					reject(err)
					return
			  }

			  resolve()
			})
		})
	}

}
