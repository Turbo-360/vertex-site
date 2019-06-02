var Event = require('../models/Event')
var cheerio = require('cheerio')
var moment = require('moment')
var utils = require('../utils')

const slugVersion = (text, numRandomChars) => {
	let slug = text.toString().toLowerCase()
			.replace(/\s+/g, '-')           // Replace spaces with -
			.replace(/[^\w\-]+/g, '')       // Remove all non-word chars
			.replace(/\-\-+/g, '-')         // Replace multiple - with single -
			.replace(/^-+/, '')             // Trim - from start of text
			.replace(/-+$/, '');            // Trim - from end of text

	if (numRandomChars == null)
		return slug.toLowerCase()

	if (numRandomChars <= 0)
		return slug.toLowerCase()

	const possible = 'abcdefghijklmnopqrstuvwxyz0123456789'
	let randomString = ''
	for (var i=0; i <numRandomChars; i++)
		randomString += possible.charAt(Math.floor(Math.random() * possible.length))

	return slug.toLowerCase()+'-'+randomString
}

const scrapePreview = (text, limit) => {
  $ = cheerio.load(text)
  let plainText = ''
  $('p').each((i, element) => {
    plainText += element.children[0].data
  })

  if (plainText.length >= limit)
    return plainText.substring(0, limit)+'...'

  return plainText
}

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

			// if coming from jQuery AJAX, profile is stringified. Parse it here first.
			if (params.location != null){
				try {
					params['location'] = JSON.parse(params.location)
				}
				catch(err){}
			}

			var date = new Date(params.date)
			params['dateString'] = moment(date).format('MMMM Do, YYYY @ hh:mm a')
			if (params.name != null)
				params['slug'] = slugVersion(params.name, 6)

			if (params.description != null)
				params['preview'] = scrapePreview(params.description, 200)

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
