var cheerio = require('cheerio')
var moment = require('moment')
var Post = require('../models/Post')
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

			// Query by filters passed into parameter string:
			var limit = params.limit
			if (limit == null)
				limit = '0'

			delete params['limit']

			Post.find(params, null, {limit:parseInt(limit), sort:{timestamp: sortOrder}}, function(err, posts){
				if (err){
					reject(err)
					return
				}

				resolve(Post.convertToJson(posts))
			})
		})
	},

	getById: function(id, isRaw){
		return new Promise(function(resolve, reject){
			Post.findById(id, function(err, post){
				if (err){
					reject(new Error('Post ' + id + ' not found'))
					return
				}

				if (post == null){
					reject(new Error('Post ' + id + ' not found'))
					return
				}

				if (isRaw){
					resolve(post)
					return
				}

				resolve(post.summary())
			})
		})
	},

	post: function(params, token, req){
		return new Promise(function(resolve, reject){
			if (req.user == null){
				reject(new Error('Please login or register to create a blog post'))
				return
			}

			params['author'] = {
				id: req.user.id,
				username: req.user.username,
				image: req.user.image,
				slug: req.user.slug,
				firstName: req.user.firstName,
				lastName: req.user.lastName,
				bio: req.user.bio
			}

			params['dateString'] = moment().format('MMMM Do, YYYY')
			if (params.text != null)
				params['preview'] = scrapePreview(params.text, 200)

			if (params.title != null)
				params['slug'] = slugVersion(params.title, 6)

			Post.create(params, function(err, post){
				if (err){
					reject(err)
					return
				}

				resolve(post.summary())
				return
			})
		})
	},

	put: function(id, params, token){
		return new Promise(function(resolve, reject){
			Post.findByIdAndUpdate(id, params, {new:true}, function(err, post){
				if (err){
					reject(err)
					return
				}

				resolve(post.summary())
			})
		})
	},

	delete: function(id){
		return new Promise(function(resolve, reject){
			Post.findByIdAndRemove(id, function (err){
			    if (err) {
					reject(err)
					return
			    }

			    resolve()
			})
		})
	}

}
