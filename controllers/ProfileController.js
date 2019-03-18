const Profile = require('../models/Profile.js')
const superagent = require('superagent')
// const Promise = require('bluebird')
const uuidv4 = require('uuid/v4') // https://www.npmjs.com/package/uuid
const utils = require('../utils')

const avatars = [
	'https://lh3.googleusercontent.com/FdU2WvDKVMndsRNCSfypX3U4k_AiPC5-OZDIXER_yXJEBhmFjdO2NTQqJVaj9rcLQl-KLO8rRQpBhCOkdtkDT0e0Ig',
	'https://lh3.googleusercontent.com/w-9oB2EzfNklJSAbcWl9MokjK7_7Yzwy2YkM0XBZ8SxiQDjIdPBj0sGbchGxKAfswG2YwDB61D0P5SE09A-XCZMN',
	'https://lh3.googleusercontent.com/MBKTQZdi8-0lqsqRYu4gHs3qRoVH-N-ek_GPZE0M7urdh4nwSQ14gkeMv3sBpG1q7fX2_ZIiig3n0dqhypScVu1rnQ',
	'https://lh3.googleusercontent.com/1YNxqUtmzsFpvE4sUi61aVmmedXngmC_UHUR0zvOdjVQdMmlyWU_40wQaNgAKddnqTmwGXmdSNoZluZ36bCTS1FhFw',
	'https://lh3.googleusercontent.com/wtsr7fa5uIKV8pzNSwKyPRqcH0fE9nqjyB48pb_-mVPtQN6Gkq6mCzzRmB0n_bdYf9rEtkT9_wglYmT4hLYh8WJr_Wg',
	'https://lh3.googleusercontent.com/jI0GFRGeWDOiL2aR_DnnF62Mt6Uy3I-FDZS1dUN0XJGOuOwLw8D2H7Z4V1Yusw5JY96xnYmSTQYPplPeVbXokbWV9Q',
	'https://lh3.googleusercontent.com/I1LbHLG7Y68yhkY-T1QnRaVxnaismy3AgRo0huqqLsug_q1Jl8H0PKalOu0wldFgWOf43m6gisbwLW34uCzs5AAl',
	'https://lh3.googleusercontent.com/GTfb8aEQnsMHpY_YyuAafwq8RAmg2-snyT1LxTkZeLntPZwvv0dMnWylkNudIjTY3OsCXRe-Wx-3LIMBONl42KZR',
	'https://lh3.googleusercontent.com/c0Rdw1SaQPRXEkfWpz5aCthPi9CCegqDthK1D91m-MD92dvHuQJvN2LKHhBIPMzY85Ai4USJH1t1ZtkZqmv3TMnj',
	'https://lh3.googleusercontent.com/OUKNRrArtawn4L0tM_Q2k-B9y3JaTwU86819-VGwZMtRd4VFMwdU5UrKzajWF-RVpTkWs-iYb2nfc25WtJnzPrnycQ'
]

module.exports = {
	get: (params, isRaw, token, req) => {
		return new Promise((resolve, reject) => {
			if (params == null)
				params = {}

			const sortOrder = (params.sort == 'asc') ? 1 : -1
			delete params['sort']

			/* Query by filters passed into parameter string: */
			let limit = params.limit
			if (limit == null)
				limit = '0'

			delete params['limit']

			if (params['tags']){
				const array = []
				const parts = params.tags.split(',') // array of tags
				parts.forEach((tag, i) => {
					array.push({tags: tag})
				})

				params = {$or: array}
				delete params['tags']
			}

			// default filter to timestamp
			const filters = {limit:parseInt(limit), sort:{timestamp: sortOrder}}

			if (params.filter != null){
				const filter = params.filter
				if (filter == 'lastLogin'){
					filters['lastLogin'] = {$ne: null}
					filters['sort'] = {lastLogin: -1}
				}

				if (filter == 'activityIndex'){
					filters['activityIndex'] = {$ne: null}
					filters['sort'] = {activityIndex: -1}
				}

				delete params['filter']
			}

			// TODO: extract this from headers, not query
			let key = ''
			if (req != null)
				key = req.query.key || ''

			delete params['key']

			Profile.find(params, null, filters, (err, profiles) => {
				if (err){
					reject(err)
					return
				}

				if (isRaw){
					resolve(profiles)
					return
				}

				// resolve(utils.Resource.convertToJson(profiles))
				resolve(Profile.convertToJson(profiles, key))
			})
		})
	},

	getById: (id, isRaw) => {
		return new Promise((resolve, reject) => {
			Profile.findById(id, (err, profile) => {
				if (err) {
					reject(err)
					return
				}

				if (profile == null){
					reject(new Error('Profile Not Found'))
					return
				}

				if (isRaw){
					resolve(profile)
					return
				}

				resolve(profile.summary())
			})
		})
	},

	post: (params) => {
		return new Promise((resolve, reject) => {
			if (params.password == null)
				params['confirmed'] = 'no'
			else if (params.password.length == 0)
				params['confirmed'] = 'no'

			let isFakeEmail = false
			const fakeDomains = ['dea-love.net', 'mvrht.net', 'fleckens.hu', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com', 'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'nwytg.com', 'sharklasers.com', 'test.com', 'ruu.kr', 'copyhome.win', 'cozaco.men', 'happyhs.party', 'iralborz.bid', 'japorms.trade', 'jiwanpani.science', 'joyandkin.cricket', 'kadaj.date', 'kcstore.faith', 'kopame.review', 'koreakr.review', 'kukov.download', 'kumli.racing', 'mimimin.webcam', 'named.accountant', 'nwytg.net', '10minut.xyz']
			for (var i=0; i<fakeDomains.length; i++){
				const domain = fakeDomains[i]
				if (params.email.indexOf(domain) != -1){ // this is a bullshit email
					isFakeEmail = true
					break
				}
			}

			if (isFakeEmail == true){ // this is a bullshit email
				reject(new Error('Please enter a valid email.'))
				return
			}

			Profile.find({email:params.email}, (err, profiles) => {
				if (err){
					reject(err)
					return
				}

				if (profiles.length > 0){ // profile with email already exists - send it back
					const profile = profiles[0]
					if (profile.password != params.password){
						reject(new Error('The email you specified currently exists in our user base. If this is your email, please log in instead.'))
						return
					}

					resolve(profile.summary())
					return
				}

				// Create new profile. This is what should happen:
				if (params.email != null){
					if (params.email.length > 0){
						const emailPrefix = params.email.split('@')[0]
						params['slug'] = emailPrefix + '-' + utils.TextUtils.randomString(6).toLowerCase()
						params['username'] = params.username || emailPrefix
						// params['image'] = params.image || process.env.DEFAULT_ICON
						params['image'] = params.image || avatars[Math.floor(Math.random()*avatars.length)]

						const nameParts = params['fullName'].split(' ')
						params['firstName'] = nameParts[0]
						if (nameParts.length > 1)
							params['lastName'] = nameParts[nameParts.length-1]
					}
				}

				const apiKey = 'pk_'+uuidv4() // pk_ prefix indicates that this is a profile key
				params['api'] = {key:apiKey, secret:''} // generate random api key:

				// estimate location based on ip addr:
				if (params.ip != null){
					if (params.ip.length > 0){
						utils.HTTP.get('http://ip-api.com/json/'+params.ip)
						.then(data => {
							params['ip'] = data
							Profile.create(params, (error, profile) => {
								if (error){
									reject(error)
									return
								}

								resolve(profile.summary())
								return
							})
						})
						.catch(err => {
							reject(err)
							return
						})

						return
					}
				}

				Profile.create(params, (error, profile) => {
					if (error){
						reject(error)
						return
					}

					resolve(profile.summary())
					return
				})
			})
		})
	},

	put: (id, params, token) => {
		// return utils.HTTP.put(process.env.VELOCITY_URL + '/api/profile/' + id, params)
		return new Promise((resolve, reject) => {
			Profile.findByIdAndUpdate(id, params, {new:true}, (err, profile) => {
				if (err){
					reject(err)
					return
				}

				resolve(profile.summary())
			})
		})
	},

	delete: (id) => {
		return new Promise((resolve, reject) => {
			Profile.findByIdAndRemove(id, (err) => {
			    if (err) {
					reject(err)
					return
			    }

			    resolve()
			})
		})
	}

}
