const express = require('express')
const router = express.Router()
const utils = require('../utils')
const controllers = require('../controllers')
const jwt = require('jsonwebtoken')
const Base64 = require('js-base64').Base64
const fs = require('fs')
const sessions = require('client-sessions')

const VERTEX_BUCKET = 'turbo360-vertex'

router.get('/:action', function(req, res, next){
	const action = req.params.action

	if (action == 'logout') {
		// req.sessionDashboard.reset()
		req.vertex_session.reset()

		// 'turbo360' is the sso cookie, 'session' is the cookie set by main site
		// const cookies = [process.env.TURBO_COOKIE_NAME, 'session']
		// const now = new Date(Date.now())
		// cookies.forEach(function(cookieName, i){
		// 	res.cookie(cookieName, '', {domain:'.turbo360.co', expires:now})
		// })

		// res.redirect(process.env.TURBO360_URL)
		res.redirect('/')
		return
	}

	if (action == 'slackinvite'){
		const body = req.query
		// if (body.name == null){
		// 	res.json({
		// 		confirmation: 'fail',
		// 		message: 'Missing name'
		// 	})
		// 	return
		// }

		if (body.email == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing email'
			})
			return
		}

		const slackInvite = 'http://api.turbo360.co/vectors/slack-invite-jofodi/slackInvite'
		utils.HTTP.get(slackInvite, {email:body.email, slack:'turbo-360', token:process.env.SLACK_ACCESS_TOKEN, key:'b6e61258-1151-4dd0-95d3-db2bec32d808'})
		.then(function(data){
			const tags = {
				title: 'Launch a Professional Website. In Seconds.',
				image: 'https://lh3.googleusercontent.com/zcu5RGyy3JbHQkhvMlrT6fjGcrs1TC7Gu0VaIJbCtwCA-vBr_NabfWTt_Sk0YceR59XoLROBANLiSPG6x-XfTlZMOA=s260-c',
				description: 'Launch a Professional Site on Turbo360. No design, no drag & drop tinkering for hours, days or weeks. Just launch your site. In seconds.'
			}

			res.render('slack-confirmation', {email:body.email, tags:tags, cdn:process.env.CDN})
		})
		.catch(function(err){
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})

		return
	}

	if (action == 'currentuser'){
		res.json({
			confirmation: 'success',
			user: req.user || null
		})

		return
	}

	if (action == 'env'){
		const variables = req.query.variables
		if (variables == null){
			res.json({
				confirmation: 'fail',
				message: 'missing variables query parameter.'
			})

			return
		}

		try {
			const env = JSON.parse(variables)
			const keys = Object.keys(env)
			let envString = ''
			keys.forEach((key, i) => {
				envString += key+'='+env[key]+'\r'
			})

			res.set("Content-Disposition", "attachment;filename=env.txt")
			res.set("Content-Type", "text/plain")
			// res.send('ENV=Variables\rTEST=123')
			res.send(envString)
		}
		catch (err) {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		}

		return
	}

	res.json({
		confirmation: 'fail',
		message: 'Invalid action'
	})
})

router.post('/:action', function(req, res, next){
	const action = req.params.action
	// console.log('BODY: ' + JSON.stringify(req.body))
	const params = req.body

	if (params.name){ // parse name into firstName and lastName
		const parts = params.name.split(' ')
		params['firstName'] = parts[0]
		if (parts.length > 1)
			params['lastName'] = parts[parts.length-1]

		params['username'] = params.firstName
		params['confirmed'] = 'yes'
	}

	if (action == 'currentuser'){
		if (params.vertex_session == null){
			res.json({
				confirmation: 'success',
				user: req.user
			})

			return
		}

		try {
			let currentUser = null
			const decoded = sessions.util.decode({cookieName:'vertex_session', secret:process.env.SESSION_SECRET}, params.vertex_session)
			controllers.profile.getById(decoded.content.user) // decoded.content.user == userID
		  .then(user => {
				currentUser = user
				return controllers.site.get({slug: params.site}) // 'great-landing-page-2qcx0x'
		  })
			.then(sites => {
				if (sites.length == 0){
					throw new Error('Site '+params.site+' not found')
					return
				}

				const site = sites[0]
				let authorized = false
				// if (site.profile.id != currentUser.id){
				// 	throw new Error('Unauthorized')
				// 	return
				// }

				if (site.profile.id == currentUser.id){
					authorized = true
				}
				else { // check if collaborator:
					const collaborators = site.collaborators
					for (let i=0; i<collaborators.length; i++){
						const collaborator = collaborators[i]
						if (collaborator.id == currentUser.id){
							authorized = true
							break
						}
					}
				}

				if (authorized != true){
					// throw new Error('Unauthorized')
					res.json({
						confirmation: 'fail',
						message: 'Unauthorized'
					})
					return
				}

				res.json({
					confirmation: 'success',
					user: currentUser,
					site: site
				})
			})
		  .catch(err => {
				throw err
		  })
		}
		catch(err){
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		}

		return
	}

	let user = null
	if (action == 'register'){
		controllers.profile.post(params)
		.then(data => {
			user = data
			return utils.Email.sendHtmlEmails(process.env.BASE_EMAIL, 'Turbo', ['dkwon@turbo360.co'], 'New Turbo User', JSON.stringify(params))
		})
		.then(data => {
			const pkg = {
				email: params.email,
				name: params.name,
				list: 'registered_users@mail.turbo360.co'
			}

			return utils.Email.addToMailingList(pkg)
		})
		.then(data => {
			return utils.fetchFile('emailtemplates/welcome/welcome.html')
		})
		.then(data => {
			const firstName = params.firstName || ''
			const html = data.replace('{{firstName}}', utils.TextUtils.capitalize(firstName))
			utils.Email.sendHtmlEmails('katrina@turbo360.co', 'Turbo 360', [params.email], 'Welcome to Turbo 360!', html)

			// set session here:
			const id = user._id || user.id
			req.vertex_session.user = id
			res.json({
				confirmation: 'success',
				redirect: params.redirect || null,
				user: {
					id: id,
					username: user.username,
					email: user.email,
					image: user.image,
					slug: user.slug,
					notifications: user.notifications
				}
			})

			// send invite to slack channel:
			const slackInvite = 'http://api.turbo360.co/vectors/slack-invite-jofodi/slackInvite'
			utils.HTTP.get(slackInvite, {email:user.email, slack:'turbo-360', token:process.env.SLACK_ACCESS_TOKEN, key:'b6e61258-1151-4dd0-95d3-db2bec32d808'})
			return
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})

			return
		})

		return
	}

	if (action == 'login'){
		if (params.email == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing Email'
			})
			return
		}

		if (params.password == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing Password'
			})
			return
		}

		controllers.profile.get({email:params.email.toLowerCase()}, true)
		.then(profiles => {
			if (profiles.length == 0){
				throw new Error('Profile Not Found')
				return
			}

			const profile = profiles[0]
			if (profile.password != params.password){
				throw new Error('Password Incorrect')
				return
			}

			// set session here:
			req.vertex_session.user = profile.id
			res.json({
				confirmation: 'success',
				user: profile
			})

			return
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})

			return
		})

		return
	}

	// this endpoint checks to see if a recently launched template is ready to serve
	// requests yet. when launching a template, the avg set-up time is around 15 secs
	// so we need an endpoint to poll before directing user to template admin page:
	if (action == 'check-template'){
		const siteSlug = req.body.template
		const url = 'https://s3.amazonaws.com/turbo360-vertex/pages/'+siteSlug+'/home.txt'
		utils.HTTP.get(url)
		.then(data => {
			res.json({
				confirmation: 'success',
				data: 'https://'+siteSlug+'.vertex360.co'
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: 'template not found'
			})
		})

		return
	}

	if (action == 'subscribe'){ // subscribe to mailing list
		const body = req.body
		if (body.email == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing email'
			})
			return
		}

		const mailingList = body['mailing-list']
		if (mailingList == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing mailing-list'
			})
			return
		}

		const pkg = {
			email: body.email,
			name: body.name, // can be null
			list: mailingList + '@mail.turbo360.co'
		}

		const templates = {
			'guide-to-freelancing': 'guide-to-freelancing.html'
		}

		utils.Email.addToMailingList(pkg)
		.then(function(data){
			return utils.Email.sendHtmlEmails('katrina@turbo360.co', 'Turbo 360', ['dkwon@turbo360.co'], 'New Mailing List Subscriber - '+body['mailing-list'], JSON.stringify(body))
		})
		.then(function(data){
			return utils.fetchFile('emailtemplates/welcome/'+templates[mailingList])
		})
		.then(function(data){ // Send email to subscriber for confirmation
			const html = data
			return utils.Email.sendHtmlEmails('katrina@turbo360.co', 'Turbo 360', [body.email], 'Welcome to Turbo 360!', html)
		})
		.then(function(data){
			const slackInvite = 'http://api.turbo360.co/vectors/slack-invite-jofodi/slackInvite'
			return utils.HTTP.get(slackInvite, {email:body.email, slack:'turbo-360', token:process.env.SLACK_ACCESS_TOKEN, key:'b6e61258-1151-4dd0-95d3-db2bec32d808'})
		})
		.then(function(data){
			res.json({
				confirmation: 'success',
				data: data
			})
		})
		.catch(function(err){
			console.log('ERROR: ' + err)
			res.json({
				confirmation: 'fail',
				message: err
			})
		})

		return
	}


	// if (action == 'slackinvite'){
	// 	const body = req.body
	// 	if (body.name == null){
	// 		res.json({
	// 			confirmation: 'fail',
	// 			message: 'Missing name'
	// 		})
	// 		return
	// 	}
	//
	// 	if (body.email == null){
	// 		res.json({
	// 			confirmation: 'fail',
	// 			message: 'Missing email'
	// 		})
	// 		return
	// 	}
	//
	// 	const firstName = body.name.split(' ')[0]
	// 	const emailHtml = 'Hello '+utils.TextUtils.capitalize(firstName)+',<br /><br />Thanks for requesting to join our Slack Channel. Please confirm your email by clicking <a style="color:red" href="https://www.turbo360.co/account/slackinvite?email='+body.email+'">HERE</a>. Thanks,<br /><br />Katrina Murphy<br />Community Developer<br /><a href="https://www.turbo360.co">Turbo 360</a>'
	// 	utils.Email.sendHtmlEmails('katrina@turbo360.co', 'Turbo 360', [body.email], 'Turbo 360 - Slack Invitation', emailHtml)
	// 	.then(function(data){
	// 		const pkg = {
	// 			email: body.email,
	// 			list: 'slack@mail.turbo360.co',
	// 			name: body.name
	// 		}
	//
	// 		return utils.Email.addToMailingList(pkg)
	// 	})
	// 	.then(function(data){
	// 		return utils.Email.sendHtmlEmails('katrina@turbo360.co', 'Turbo 360', ['dkwon@turbo360.co'], 'New Slack Subscriber', JSON.stringify(body))
	// 	})
	// 	.then(function(data){
	// 		res.json({
	// 			confirmation: 'success',
	// 			data: data
	// 		})
	// 	})
	// 	.catch(function(err){
	// 		res.json({
	// 			confirmation: 'fail',
	// 			message: err.message
	// 		})
	// 	})
	//
	// 	return
	// }

	// update current profile
	if (action == 'update'){
		// TODO: Check if user being updated is currently logged in. If not, block the update:

		if (params.id == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing ID parameter'
			})

			return
		}

		let currentUser = null
		let updatedProfile = null

		controllers.profile.put(params.id, params)
		.then(data => {
			currentUser = data
			updatedProfile = {
				id: currentUser.id,
				firstName: currentUser.firstName,
				lastName: currentUser.lastName,
				image: currentUser.image,
				email: currentUser.email,
				username: currentUser.username
			}

			return controllers.site.get({'collaborators.id':currentUser.id}, true)
		})
		.then(data => {
			data.forEach((site, i) => {
				const collaborators = []
				site.collaborators.forEach((collaborator, j) => {
					if (collaborator.id != currentUser.id)
						collaborators.push(collaborator)
				})

				collaborators.push(updatedProfile)
				site['collaborators'] = collaborators
				site.save()
			})

			// return
			return controllers.site.get({'profile.id':currentUser.id}, true)
		})
		.then(data => {
			data.forEach((site, i) => {
				site['profile'] = updatedProfile
				site.markModified('profile')
				site.save()
			})

			res.json({
				confirmation: 'success',
				user: currentUser
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})

			return
		})

		return
	}

	if (action == 'deletesite'){
		controllers.site.getById(req.body.site) // fetch app first to get full details
		.then(data => {
			return utils.AWS.deleteFunction({name: data.slug}) // delete function from lamdba
		})
		.then(data => {
			return controllers.site.delete(req.body.site)
		})
		.then(data => {
			res.json({
				confirmation: 'success',
				data: req.body
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})

		return
	}

	if (action == 'launch-template'){
		const params = req.body
		if (req.user == null){
			res.json({
				confirmation: 'fail',
				message: 'User not logged in'
			})
			return
		}

		const newSiteInfo = {
			name: params.name,
			isClone: 'yes',
			source: 'vertex360',
			profile: {
				id: req.user.id,
		    slug: req.user.slug,
  			image: req.user.image,
  			username: req.user.username,
  			lastName: req.user.lastName,
  			firstName: req.user.firstName
			}
		}

		const folder = {bucket: VERTEX_BUCKET}
		let lambda = null
		let newSite = null
		let copiedSite = null

		controllers.site.getById(params.source) // fetch original site first
		.then(data => {
			copiedSite = data
			folder['copiedSite'] = copiedSite
			folder['source'] = copiedSite.slug
			newSiteInfo['pages'] = (copiedSite.pages) ? Object.assign([], copiedSite.pages) : ['home']
			newSiteInfo['image'] = copiedSite.image
			newSiteInfo['template'] = {staus:'dev', category:copiedSite.template.category}
			newSiteInfo['globalConfig'] = Object.assign({}, copiedSite.globalConfig)
			newSiteInfo['cloneSource'] = copiedSite.id
			return controllers.site.post(newSiteInfo) // create new site
		})
		.then(data => {
			newSite = data
			folder['newSite'] = newSite
			folder['app'] = newSite.slug // new app to copy source to
			// return controllers.site.getById(params.source) // get site that is being copied
			return utils.Email.sendHtmlEmails(process.env.BASE_EMAIL, 'Vertex 360', ['dkwon@turbo360.co'], 'Vertex Template Launched', JSON.stringify(folder))
		})
		.then(data => {
			// send POST request to https://platform.turbo360-vector.com/launchtemplate
			// with 'folder' as params
			// const url = 'https://platform.turbo360-vector.com/launchtemplate'

			// Don't wait for this to return, it takes ~20 seconds. Send back response
			// right away then do follow up requests client-side
			utils.HTTP.post('http://platform.turbo360-vector.com/launchtemplate', folder)
			res.json({
				confirmation: 'success',
				data: newSite
			})

			return
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message || err
			})
		})

		return
	}

	/*
	if (action == 'update-template'){
		const params = req.body
		if (req.user == null){
			res.json({
				confirmation: 'fail',
				message: 'User not logged in'
			})
			return
		}

		const site = params.site
		if (site == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing site parameter'
			})
			return
		}

		const folder = {
			bucket: VERTEX_BUCKET
		}

		const cloneSource = site.cloneSource // TODO: check if valid id string
		let lambda = null
		let currentSite = null
		let copiedSite = null
		const updatedSiteInfo = {}

		controllers.site.getById(cloneSource) // fetch original site first
		.then(data => {
			copiedSite = data
			folder['copiedSite'] = copiedSite
			folder['source'] = copiedSite.slug
			updatedSiteInfo['globalConfig'] = Object.assign({}, copiedSite.globalConfig)
			return controllers.site.put(site.id, updatedSiteInfo) // update site globalConfig only
		})
		.then(data => {
			currentSite = data
			folder['newSite'] = currentSite
			folder['app'] = currentSite.slug // new app to copy source to

			// send POST request to https://platform.turbo360-vector.com/launchtemplate
			// with 'folder' as params
			return utils.HTTP.post('http://platform.turbo360-vector.com/updatetemplate', folder)
		})
		.then(data => {
			res.json({
				confirmation: 'success',
				data: currentSite
			})

			return
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message || err
			})
		})

		return
	}


	// clone an app into another app
	// TODO: this should moved to a platform lambda
	if (action == 'clone'){
		const params = req.body
		let lambda = null

		utils.AWS.copyFolder(params)
		.then(data => {
			lambda = {
				name: params.app, // this has to be the appslug
				path: params.app + '/package.zip',
				env: {
					TURBO_CDN: 'https://cdn.turbo360-vertex.com/'+params.app+'/public', // https://cdn.turbo360-vertex.com/resume-clone-4aglq4/public
					TURBO_ENV: 'prod',
					SESSION_SECRET: '<YOUR_SESSION_SECRET>',
					TURBO_API_KEY: params.api.key,
					TURBO_APP_ID: params.appId
				}
			}

			return utils.AWS.getFunction({name: params.source}) // slug of app being copied
		})
		.then(data => {
			const envVariables = data.Configuration.Environment.Variables
			const keys = Object.keys(envVariables)
			keys.forEach(function(key, i){
				if (lambda.env[key] == null)
					lambda.env[key] = envVariables[key]
			})

			return utils.AWS.getFunction(lambda) // check if already exists first. If so, delete
		})
		.then(data => { // check if already exists first. If so, delete
			return (data == null) ? null : utils.AWS.deleteFunction(lambda)
		})
		.then(data => { // connect to lambda
			return utils.AWS.deployVertex(lambda)
		})
		.then(data => {
			// console.log('PARAMS: ' + JSON.stringify(params))
			if (params.pages!=null && params.sourceId!=null){
				try { // might be stringified client-side
					params['pages'] = JSON.parse(params.pages)
				}
				catch (err){}

				params.pages.forEach(function(page, i){
					const pageKey = params.appId+'-'+page+'.json'
					utils.AWS.copyObject({
						object: '/'+VERTEX_BUCKET+'/pages/'+params.sourceId+'-'+page+'.json',
						newObject: pageKey,
						destinationBucket: VERTEX_BUCKET+'/pages'
					})
				})
			}

			utils.Email.sendHtmlEmails(process.env.BASE_EMAIL, 'Turbo', ['dkwon@turbo360.co'], 'Turbo Site Cloned', JSON.stringify(params))
			res.json({
				confirmation: 'success',
				result: {
					format: 'vertex',
					slug: params.app
				}
			})

			return
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message || err
			})
		})

		return
	}

	if (action == 'updateclone') {
		const params = req.body
		let lambda = null

		utils.AWS.copyFolder(params)
		.then(function(data){
			lambda = {
				name: params.app, // this has to be the appslug
				path: params.app + '/package.zip',
				env: {} // no deafult env
			}

			return utils.AWS.getFunction({name: params.source}) // slug of app being copied
		})
		.then(function(data){ // env variables of original source:
			const envVariables = data.Configuration.Environment.Variables
			const keys = Object.keys(envVariables)
			keys.forEach(function(key, i){
				if (lambda.env[key] == null) // this adds any new keys since the last update or original clone:
					lambda.env[key] = envVariables[key]
			})

			return utils.AWS.getFunction(lambda) // check if already exists first. If so, delete
		})
		.then(data => {
			if (data != null){
				// overwrite updated env with variables from user's version
				const envVariables = data.Configuration.Environment.Variables
				const keys = Object.keys(envVariables)
				keys.forEach(function(key, i){
					lambda.env[key] = envVariables[key]
				})

				return utils.AWS.deleteFunction(lambda)
			}

			return null
		})
		.then(function(data){ // connect to lambda
			return utils.AWS.deployVertex(lambda)
		})
		.then(function(data){ // invalidate cache so static assets reload
			return utils.AWS.invalidateCache('EQIKQLMTLKH4C', params.app, '*')
		})
		.then(function(data){
			res.json({
				confirmation: 'success',
				result: {
					format: 'vertex',
					slug: params.app
				}
			})

			return
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})

		return
	} */

	if (action == 'uploadurl') {
		// query requires folder, filename, filetype

		utils.AWS.uploadUrl(req.body, req.body.bucket)
		.then(function(data){
			res.json({
				confirmation: 'success',
				data: data
			})
		})
		.catch(function(err){
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})

		return
	}

	if (action == 'invalidatecache') {
		console.log('INVALIDATE CACHE: ' + JSON.stringify(req.body))
		utils.AWS.invalidateCache(req.body.dist, req.body.folder, req.body.file)
		.then(function(data){
			res.json({
				confirmation: 'success',
				data: data
			})
		})
		.catch(function(err){
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})

		return
	}

	if (action == 'create-stripe-customer'){
		if (params == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing body params'
			})

			return
		}

		console.log('create-stripe-customer: ' + JSON.stringify(params))
		// create-stripe-customer: {"stripeToken":"tok_1DFDEBC5b8QCRB75JdFLN1Fs",
		// "email":"dennykwon2@gmail.com","name":"denny kwon","firstName":"denny","lastName":"kwon",
		// "username":"denny","confirmed":"yes"}

		let customer = null
		let card = null

		utils.Stripe.addCustomer(params, process.env.STRIPE_SECRET_KEY)
		.then(data => {
			customer = data.customer
			card = data.card
			const subject = (params.description==null) ? 'New PREMIUM Customer' : 'New Subscriber: '+params.description.toUpperCase()
			return utils.Email.sendHtmlEmails(process.env.BASE_EMAIL, 'Turbo', ['dkwon@turbo360.co'], subject, JSON.stringify(data))
			// return utils.Email.sendHtmlEmails(process.env.BASE_EMAIL, 'Turbo', ['dkwon@turbo360.co'], 'New Premium Customer', JSON.stringify(data))
		})
		.then(data => {
			res.json({
				confirmation: 'success',
				card: card,
				customer: customer
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})

		return
	}


	if (action == 'stripe-charge'){
		if (params == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing body params'
			})

			return
		}

		console.log('PARAMS: ' + JSON.stringify(params))

		// params requires amount, stripeToken, name, description
		utils.Stripe.processCharge(params, process.env.STRIPE_SECRET_KEY)
		.then(data => {
			return utils.Email.sendHtmlEmails(process.env.BASE_EMAIL, 'Turbo', ['dkwon@turbo360.co'], 'Live Course Registration', JSON.stringify(params))
		})
		.then(data => {
			res.json({
				confirmation: 'success',
				data: data
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})

		return
	}

	if (action == 'invitecollaborator'){
		const params = req.query
		if (params.site == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing site identifier.'
			})
			return
		}

		if (params.invited == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing invited parameter.'
			})
			return
		}

		let invitee = null
		let currentSite = null

		controllers.site.getById(params.site)
		.then(site => {
			const invited = params.invited
			invitee = invited[invited.length-1]

			const currentInvited = site.invited || []
			if (currentInvited.indexOf(invitee) == -1)
				currentInvited.push(invitee)

			return controllers.site.put(params.site, {invited:currentInvited}, null)
		})
		.then(site => {
			currentSite = site

			// send email to invitee
			const from = params.from
			delete params['from']

			const confirmLink = 'https://www.vertex360.co/account/acceptinvitation?invitation='+Base64.encode(JSON.stringify({site:params.site, invitee:invitee}))
			const content = 'Hello,<br /><br />You have been invited to collaborate on a <a style="color:red" href="https://www.vertex360.co">Vertex 360</a> project: <strong>'+currentSite.name+'</strong>. You were invited by '+from+'.<br /><br />To confirm the invitation, click on the link below:<br /><br /><a style="color:red" href="'+confirmLink+'">'+confirmLink+'</a><br /><br />Thanks,<br /><br />The Vertex 360 Team<br />www.vertex360.co<br /><img src="https://d2t33r63549y14.cloudfront.net/landing-page-zejvaj/dist/images/canvasone.png" />'
			return utils.Email.sendHtmlEmails('katrina@velocity360.io', 'Vertex 360', [invitee], 'Invitation', content)
		})
		.then(function(data){
			res.json({
				confirmation: 'success',
				result: currentSite
			})

			return
		})
		.catch(function(err){
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			return
		})
		return
	}

	res.json({
		confirmation: 'fail',
		message: 'Invalid action'
	})
})

module.exports = router
