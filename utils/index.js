const Promise = require('bluebird')
const fs = require('fs')
const Base64 = require('js-base64').Base64

const JWT = require('./JWT')
const TextUtils = require('./TextUtils')
const Resource = require('./Resource')
const Email = require('./Email')
const AWS = require('./AWS')
const HTTP = require('./HTTP')
const Stripe = require('./Stripe')
const Scraper = require('./Scraper')


module.exports = {
	JWT: JWT,
	AWS: AWS,
	TextUtils: TextUtils,
	Resource: Resource,
	Email: Email,
	HTTP: HTTP,
	Stripe: Stripe,
	Scraper: Scraper,
	renderAnalytics: function(req, CDN){
		const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		// console.log('renderAnalytics: ' + ip)
		if (ip==process.env.IGNORE_IP) // ignore this ip address
			return false

		if (req.user == null)
			return (CDN!=null)

		const found = (ignore.indexOf(req.user.id) > -1)
		return !found
	},
	fetchFile: function(path){
		return new Promise(function(resolve, reject){
			fs.readFile(path, 'utf8', function(err, data) {
				if (err){
					reject(err)
					return
				}

				resolve(data)
			})
		})
	},
	currentUserId: function(req){
		if (req.cookies == null)
			return null

		// const userId = req.cookies.turbo360
		const cookieStr = req.cookies[process.env.TURBO_COOKIE_NAME]
		if (cookieStr == null)
			return null

		try {
			cookieStr = Base64.decode(cookieStr)
			cookieStr = cookieStr.replace(process.env.SSO_KEY, '')

			const cookie = JSON.parse(cookieStr)
			if (cookie.id == null)
				return null

			return cookie.id
		}
		catch(err) {
			return null
		}
	}
}
