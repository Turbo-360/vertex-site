var Thread = require('../models/Thread')
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

			Thread.find(params, null, {limit:parseInt(limit), sort:{timestamp: sortOrder}}, function(err, threads){
				if (err){
					reject(err)
					return
				}

				resolve(utils.Resource.convertToJson(threads))
			})
		})
	},

	getById: function(id, isRaw){
		return new Promise(function(resolve, reject){
			Thread.findById(id, function(err, thread){
				if (err){
					reject(new Error('Thread ' + id + ' not found'))
					return
				}

				if (thread == null){
					reject(new Error('Thread ' + id + ' not found'))
					return
				}

				if (isRaw){
					resolve(thread)
					return
				}

				resolve(thread.summary())
			})
		})
	},

	post: function(params){
		return new Promise(function(resolve, reject){
			// var date = new Date(params.date)
			// params['dateString'] = moment(date).format('MMMM Do, YYYY @ hh:mm a')
			// if (params.name != null)
			// 	params['slug'] = slugVersion(params.name, 6)
      //
			// if (params.description != null)
			// 	params['preview'] = scrapePreview(params.description, 200)

			Thread.create(params, function(err, thread){
				if (err){
					reject(err)
					return
				}

				resolve(thread.summary())
				return
			})
		})
	},

	put: function(id, params, token){
		return new Promise(function(resolve, reject){
			Thread.findByIdAndUpdate(id, params, {new:true}, function(err, thread){
				if (err){
					reject(err)
					return
				}

				resolve(thread.summary())
			})
		})
	},

	delete: function(id){
		return new Promise(function(resolve, reject){
			Thread.findByIdAndRemove(id, function (err){
			  if (err) {
					reject(err)
					return
			  }

			  resolve()
			})
		})
	}

}
