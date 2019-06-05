const express = require('express')
const router = express.Router()
const utils = require('../utils')
const controllers = require('../controllers')
const jwt = require('jsonwebtoken')
const Base64 = require('js-base64').Base64
const fs = require('fs')
const deepmerge = require('deepmerge')
const sessions = require('client-sessions')

const VERTEX_BUCKET = 'turbo360-vertex'

const addToMailchimp = (body) => {
	return new Promise((resolve, reject) => {
		const parts = body.name.split(' ')
		const firstName = parts[0]
		const lastName = (parts.length > 1) ? parts[parts.length-1] : ''
		const subscriber = {
				email_address: body.email.toLowerCase().trim(),
		    status: 'subscribed',
		    merge_fields: {
		        FNAME: firstName.trim(),
		        LNAME: lastName.trim()
		    }
		}

		const endpoint = 'https://us20.api.mailchimp.com/3.0/lists/3cb0bfbc56/members/'
		const basic = 'Basic '+Base64.encode('awef:'+process.env.MAILCHIMP_API_KEY)
		utils.HTTP.post(endpoint, subscriber, {'Authorization': basic})
		.then(data => {
			resolve(data)
		})
		.catch(err => {
			reject(err)
		})
	})
}

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

	/*
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
	} */

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

	if (action == 'scrape'){
		if (req.query.url == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing url parameter'
			})
			return
		}

		utils.Scraper.scrape({url:req.query.url})
		.then(data => {
			res.json({
				confirmation: 'success',
				data: data
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				data: err.message
			})
		})

		// utils.HTTP.post(process.env.PLATFORM_VECTOR_URL, {url:req.query.url, props:['title', 'description', 'image']})
		// .then(data => {
		// 	res.json({
		// 		confirmation: 'success',
		// 		data: data
		// 	})
		// })
		// .catch(err => {
		// 	res.json({
		// 		confirmation: 'fail',
		// 		data: err.message
		// 	})
		// })

		return
	}

	if (action == 'acceptinvitation'){
		const invitation = req.query.invitation
		if (invitation == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing invitation'
			})
			return
		}

		const decoded = Base64.decode(invitation)
		const parsed = JSON.parse(decoded) // {"site":"591851091aba5200114c1fb6","invitee":"dennykwon2@gmail.com"}
		if (parsed.site == null){
			res.json({
				confirmation: 'fail',
				message: 'Invalid Invitation'
			})
			return
		}

		if (parsed.invitee == null){
			res.json({
				confirmation: 'fail',
				message: 'Invalid Invitation'
			})
			return
		}

		let hostSite = null
		let resetpassword = false
		controllers.site.getById(parsed.site)
		.then(site => {
			if (site.invited.indexOf(parsed.invitee) == -1){ // not actually invited
				res.json({
					confirmation: 'fail',
					message: 'Invalid Invitation'
				})

				return
			}

			hostSite = site

			// check if invitee already registered:
			return controllers.profile.get({email: parsed.invitee.toLowerCase()})
		})
		.then(profiles => {
			if (profiles.length > 0){ // use existing profile
				return profiles[0]
			}
			else {
				// create new profile, remove email from invited array
				resetpassword = true
				const params = {
					firstName: '',
					lastName: '',
					email: parsed.invitee,
					username: parsed.invitee.split('@')[0],
					password: utils.TextUtils.randomString(8) // assign random password
				}

				return controllers.profile.post(params)
			}
		})
		.then(user => {
			const userId = user._id || user.id
			// req.session.user = userId // log user in
			req.vertex_session.user = userId // log user in

			const collaborators = hostSite.collaborators
			collaborators.push({
				id: userId,
				email: user.email,
				slug: user.slug,
				image: user.image,
				username: user.email.split('@')[0],
				firstName: user.firstName,
				lastName: user.lastName
			})

			// remove email from invited:
			const invited = []
			hostSite.invited.forEach((email, i) => {
				if (email != user.email)
					invited.push(email)
			})

			return controllers.site.put(hostSite.id, {collaborators:collaborators, invited:invited}, null)
		})
		.then(data => {
			const redirect = (resetpassword == true) ? 'https://www.vertex360.co/me?selected=sites&resetpassword=true' : 'https://www.vertex360.co/me?selected=sites'
			res.redirect(redirect)
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

router.post('/:action', function(req, res, next){
	const action = req.params.action
	const params = req.body

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
			return utils.Email.sendHtmlEmails(process.env.BASE_EMAIL, 'Vertex 360', ['dkwon@turbo360.co'], 'New Vertex 360 User', JSON.stringify(params))
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
			// utils.Email.sendHtmlEmails('katrina@turbo360.co', 'Turbo 360', [params.email], 'Welcome to Turbo 360!', html)

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
			// const slackInvite = 'http://api.turbo360.co/vectors/slack-invite-jofodi/slackInvite'
			// utils.HTTP.get(slackInvite, {email:user.email, slack:'turbo-360', token:process.env.SLACK_ACCESS_TOKEN, key:'b6e61258-1151-4dd0-95d3-db2bec32d808'})
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

	// attend event:
	if (action == 'rsvp'){
		controllers.ticket.post(req.body)
		.then(data => {
			return addToMailchimp(req.body)
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


	if (action == 'mailchimp'){ // subscribe to Mailchimp mailing list
		const body = req.body
		if (body.email == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing EMAIL'
			})
			return
		}

		if (body.name == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing NAME'
			})
			return
		}

		// const parts = body.name.split(' ')
		// const firstName = parts[0]
		// const lastName = (parts.length > 1) ? parts[parts.length-1] : ''
		// const subscriber = {
		// 		email_address: body.email.toLowerCase().trim(),
		//     status: 'subscribed',
		//     merge_fields: {
		//         FNAME: firstName.trim(),
		//         LNAME: lastName.trim()
		//     }
		// }
		//
		// const endpoint = 'https://us20.api.mailchimp.com/3.0/lists/3cb0bfbc56/members/'
		// const basic = 'Basic '+Base64.encode('awef:'+process.env.MAILCHIMP_API_KEY)
		// const headers = {'Authorization': basic}
		// utils.HTTP.post(endpoint, subscriber, headers)

		addToMailchimp(body)
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
		let site = null
		controllers.site.getById(req.body.site) // fetch app first to get full details
		.then(data => {
			site = data
			return controllers.site.delete(req.body.site)
		})
		.then(data => {
			// delete function from lamdba.
			// do this without waiting for return.
			utils.AWS.deleteFunction({name: site.slug})
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

	// Called when user clones and existing template:
	if (action == 'launch-template'){
		const params = req.body
		if (req.user == null){
			res.json({
				confirmation: 'fail',
				message: 'User not logged in'
			})
			return
		}

		console.log('LAUNCH TEMPLATE: ' + JSON.stringify(params))

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
			const emailJson = {
				newSite: newSite,
				original: {
					id: folder.copiedSite.id,
					name: folder.copiedSite.name,
					profile: folder.copiedSite.profile
				}
			}
			return utils.Email.sendHtmlEmails(process.env.BASE_EMAIL, 'Vertex 360', ['dkwon@turbo360.co'], 'Vertex Template Launched', JSON.stringify(emailJson))
		})
		.then(data => {
			// console.log('FOLDER: ' + JSON.stringify(folder))
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
			console.log('ERROR: ' + err)
			res.json({
				confirmation: 'fail',
				message: err.message || err
			})
		})

		return
	}

	// called when user "refreshes" template from original source
	if (action == 'update-template'){
		const params = req.body
		if (req.user == null){
			res.json({
				confirmation: 'fail',
				message: 'User not logged in'
			})
			return
		}

		const site = req.body.site
		if (site == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing site parameter'
			})
			return
		}

		let lambda = null
		let copiedSite = null
		const folder = {
			bucket: VERTEX_BUCKET,
			newSite: site,
			app: site.slug // new app to copy source to
		}

		controllers.site.getById(site.cloneSource) // fetch original site first
		.then(data => {
			copiedSite = data
			folder['copiedSite'] = copiedSite
			folder['source'] = copiedSite.slug
			return utils.HTTP.post('http://platform.turbo360-vector.com/updatetemplate', folder)
		})
		.then(data => {
			// this lambda takes the updated page configurations from the original
			// template and merges them with the page configurations of the current site
			return utils.HTTP.post('http://platform.turbo360-vector.com/sync-pages', {template:copiedSite.slug, site:site.slug})
		})
		.then(data => {
			// update global from copiedSite to current site
			// cloned = deepmerge.all([updatedPageConfiguration, currentConfig])
			const updatedGlobalConfig = deepmerge.all([copiedSite.globalConfig, site.globalConfig], {arrayMerge:(destinationArray, sourceArray, options) => sourceArray})
			return controllers.site.put(site.id, {globalConfig: updatedGlobalConfig})
		})
		.then(data => {
			res.json({
				confirmation: 'success',
				data: folder
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

	// called when user (developer) creates a template from scratch
	if (action == 'createtemplate') {
		if (req.user == null){
			res.json({
				confirmation: 'fail',
				message: 'Please register or login to create a template.'
			})

			return
		}

		const profile = {
			id: req.user.id,
			username: req.user.username,
			firstName: req.user.firstName,
			lastName: req.user.lastName,
			image: req.user.image,
			slug: req.user.slug
		}

		const template = {
			profile: profile,
			name: req.body.name,
			format: 'vertex',
			origin: 'vertex360',
			isClone: 'no',
			template: {
				category: req.body.category,
				status: 'dev'
			}
		}

		controllers.site.post(template)
		.then(data => {
			// TODO: create stores and pages folders
			// this lamdba creates 'stores' and 'pages' directories for
			// the new template. don't wait for it to return, let it run.
			utils.HTTP.post(process.env.PLATFORM_VECTOR_URL+'/seedtemplate', {source:req.body.category, app:data.slug}, null)

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
		// create-stripe-customer: {"stripeToken":"tok_1Ec1OwC5b8QCRB75s0gRulGY","email":"dennykwon2@gmail.com","name":"denny kwon","description":"Vertex Pro Member","firstName":"denny","lastName":"kwon","username":"denny","confirmed":"yes"}

		let customer = null
		let card = null

		utils.Stripe.addCustomer(params, process.env.STRIPE_SECRET_KEY)
		.then(data => {
			customer = data.customer
			card = data.card
			// const subject = (params.description==null) ? 'New PREMIUM Customer' : 'New Subscriber: '+params.description.toUpperCase()
			return utils.Email.sendHtmlEmails(process.env.BASE_EMAIL, 'Vertex 360', ['dkwon@turbo360.co'], params.description, JSON.stringify(data))
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

	if (action == 'resetpassword'){
		if (req.user == null){
			res.json({
				confirmation: 'fail',
				message: 'User not logged in'
			})
			return
		}

		if (req.user.id != req.body.user){
			res.json({
				confirmation: 'fail',
				message: 'User not logged in'
			})
			return
		}

		// req.body - {"password":"aaa","user":"5c20726d07f5280017e26074"}
		controllers.profile.put(req.body.user, {password:req.body.password})
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

	// upvote or downvote something
	if (action == 'vote'){
		if (req.user == null){
			res.json({
				confirmation: 'fail',
				message: 'Please register or login to vote.'
			})

			return
		}

		// req.body == {"profile":"5cb93ce57df02703d5ddc25a","comment":"downvote-5cd859b13c68910c1f909bad"}
		const voteInfo = req.body.comment
		const parts = voteInfo.split('-')
		if (parts.length < 2){
			res.json({
				confirmation: 'fail',
				message: 'Invalid vote info'
			})
			return
		}

		const upOrDown = parts[0] // 'upvote' or 'downvote'
		const commentId = parts[1]

		controllers.comment.getById(commentId, true) // fetch raw version
		.then(comment => {
			const votes = Object.assign({}, comment.votes)
			let votesChanged = false
			if (upOrDown=='upvote' && votes.up.indexOf(req.user.id)==-1){
				votesChanged = true
				votes.up.push(req.user.id)
				if (votes.down.indexOf(req.user.id)!=-1)
					votes.down.splice(votes.up.indexOf(req.user.id), 1)
			}

			if (upOrDown=='downvote' && votes.down.indexOf(req.user.id)==-1){
				votesChanged = true
				votes.down.push(req.user.id)
				if (votes.up.indexOf(req.user.id)!=-1)
					votes.up.splice(votes.up.indexOf(req.user.id), 1)
			}

			if (votesChanged == true){
				votes.score = (votes.up.length-votes.down.length)
				comment['votes'] = votes
				comment.save()
			}

			res.json({
				confirmation: 'success',
				data: comment.summary()
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

	if (action == 'updatereplies'){
		const commentId = req.body.comment
		if (commentId == null){
			res.json({
				confirmation: 'fail',
				message: 'Missing commentId parameter'
			})
			return
		}

		controllers.comment.get({thread: commentId})
		.then(replies => {
			return controllers.comment.put(commentId, {numReplies:replies.length})
		})
		.then(comment => {
			res.json({
				confirmation: 'success',
				data: comment
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
		const params = req.body
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
			const from = params.from.toUpperCase()
			delete params['from']

			const confirmLink = 'https://www.vertex360.co/account/acceptinvitation?invitation='+Base64.encode(JSON.stringify({site:params.site, invitee:invitee}))
			const content = 'Hello,<br /><br />You have been invited to collaborate on a <a style="color:red" href="https://www.vertex360.co">Vertex 360</a> project: <a href="https://'+currentSite.slug+'.vertex360.co"><strong>'+currentSite.name+'</strong></a>. You were invited by '+from+'.<br /><br />To confirm the invitation, click on the link below:<br /><br /><a style="color:red" href="'+confirmLink+'">'+confirmLink+'</a><br /><br />Thanks,<br /><br />The Vertex 360 Team<br />www.vertex360.co<br /><a href="https://www.vertex360.co"><img src="https://lh3.googleusercontent.com/hlcLdauNL9UiLa3K4wF5ZPNpHzi50R26y61Ahx7oRMbUNgujN-1SmeC_3zG4EHLBH5WnRhQ1ZS19KF_xcWqkTKoENw=s320" /></a>'
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
