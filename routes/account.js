const express = require('express')
const router = express.Router()
const utils = require('../utils')
const controllers = require('../controllers')
const jwt = require('jsonwebtoken')
const Base64 = require('js-base64').Base64
const fs = require('fs')

router.get('/:action', function(req, res, next){
	const action = req.params.action

	if (action == 'logout') {
		// req.sessionDashboard.reset()
		req.session.reset()

		// 'turbo360' is the sso cookie, 'session' is the cookie set by main site
		// const cookies = [process.env.TURBO_COOKIE_NAME, 'session']
		// const now = new Date(Date.now())
		// cookies.forEach(function(cookieName, i){
		// 	res.cookie(cookieName, '', {domain:'.turbo360.co', expires:now})
		// })

		res.redirect(process.env.TURBO360_URL)
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
			req.session.user = id
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
			req.session.user = profile.id
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


	if (action == 'slackinvite'){
		const body = req.body
		if (body.name == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing name'
			})
			return
		}

		if (body.email == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing email'
			})
			return
		}

		const firstName = body.name.split(' ')[0]
		const emailHtml = 'Hello '+utils.TextUtils.capitalize(firstName)+',<br /><br />Thanks for requesting to join our Slack Channel. Please confirm your email by clicking <a style="color:red" href="https://www.turbo360.co/account/slackinvite?email='+body.email+'">HERE</a>. Thanks,<br /><br />Katrina Murphy<br />Community Developer<br /><a href="https://www.turbo360.co">Turbo 360</a>'
		utils.Email.sendHtmlEmails('katrina@turbo360.co', 'Turbo 360', [body.email], 'Turbo 360 - Slack Invitation', emailHtml)
		.then(function(data){
			const pkg = {
				email: body.email,
				list: 'slack@mail.turbo360.co',
				name: body.name
			}

			return utils.Email.addToMailingList(pkg)
		})
		.then(function(data){
			return utils.Email.sendHtmlEmails('katrina@turbo360.co', 'Turbo 360', ['dkwon@turbo360.co'], 'New Slack Subscriber', JSON.stringify(body))
		})
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

	if (action == 'launchtemplate'){
		const params = req.body
		let lambda = null


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
					SESSION_SECRET: 'ew1234fhaulwef',
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

				const vertexBucket = 'turbo360-vertex'
				params.pages.forEach(function(page, i){
					const pageKey = params.appId+'-'+page+'.json'
					utils.AWS.copyObject({
						object: '/'+vertexBucket+'/pages/'+params.sourceId+'-'+page+'.json',
						newObject: pageKey,
						destinationBucket: vertexBucket+'/pages'
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
	}

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

	res.json({
		confirmation: 'fail',
		message: 'Invalid action'
	})
})

module.exports = router
