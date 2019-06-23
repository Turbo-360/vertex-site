// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const router = vertex.router()
const controllers = require('../controllers')
const utils = require('../utils')
const CDN = (process.env.TURBO_ENV=='dev') ? null : process.env.CDN_ROOT

const ignore = process.env.IGNORE.split(',')
const renderAnalytics = (req) => {
	if (req.user == null)
		return (CDN!=null)

	const found = (ignore.indexOf(req.user.id) > -1)
	return !found
}

const hasVideo = (site) => {
	if (site.template.video == null)
		return false

	return (site.template.video.length==11) // youtube IDs are 11 characters;
}


router.get('/', (req, res) => {
	// const selected = 'landing'
	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	// controllers.site.get({'template.status':'live', format:'vertex', sort:'asc'})
	controllers.site.get({'template.status':'live', format:'vertex'})
	.then(sites => {
		sites.forEach((site, i) => {
			site['hasVideo'] = false
			if (site.template.video != null)
				site['hasVideo'] = (site.template.video.length==11) // youtube IDs are 11 characters

			site['index'] = i
			site['tags'] = site.tags.slice(0, 3) // use only first 3
			site['description'] = utils.TextUtils.convertToHtml(site.description)
		})

		data['templates'] = sites
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			// stripe: process.env.STRIPE_PK_LIVE,
			query: req.query,
			user: req.user,
			templates: sites,
			static: {
				faq: require('../public/static/faq.json')
			}
		})

		// res.render('landing', data)
		res.render('index', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/community', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req),
		profile: req.user
	}


	controllers.comment.get({limit:10, isInitial:'yes'})
	.then(comments => {
		comments.forEach(comment => {
			comment['isLink'] = (comment.url.length > 0)
		})

		data['comments'] = comments
		return controllers.post.get()
	})
	.then(posts => {
		data['posts'] = posts
		return controllers.site.get({'template.status':'live', format:'vertex', sort:'asc'})
	})
	.then(sites => {
		sites.forEach((site, i) => {
			site['index'] = i
			site['tags'] = site.tags.slice(0, 3) // use only first 3
			site['description'] = utils.TextUtils.convertToHtml(site.description)
		})

		data['templates'] = sites
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			user: req.user
		})

		res.render('community', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/submitpost', (req, res) => {
	const data = {
		cdn: CDN
	}

	if (req.query.id == null){
		data['preloaded'] = JSON.stringify({
			query: req.query,
			user: req.user,
			post: null
		})

		res.render('submitpost', data)
	}

	controllers.post.getById(req.query.id)
	.then(post => {
		data['preloaded'] = JSON.stringify({
			query: req.query,
			user: req.user,
			post: post
		})

		res.render('submitpost', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: 'Post '+req.query.id+' not found'
		})
	})
})

router.get('/submitevent', (req, res) => {
	const data = {
		cdn: CDN
	}

	if (req.query.id == null){
		data['preloaded'] = JSON.stringify({
			query: req.query,
			user: req.user,
			post: null
		})

		res.render('submitevent', data)
	}

	// controllers.post.getById(req.query.id)
	// .then(post => {
	// 	data['preloaded'] = JSON.stringify({
	// 		query: req.query,
	// 		user: req.user,
	// 		post: post
	// 	})
	//
	// 	res.render('submitpost', data)
	// })
	// .catch(err => {
	// 	res.json({
	// 		confirmation: 'fail',
	// 		message: 'Post '+req.query.id+' not found'
	// 	})
	// })
})



router.get('/templates', (req, res) => {
	const selected = 'landing'
	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	controllers.site.get({'template.status':'live', format:'vertex'})
	.then(sites => {
		sites.forEach((site, i) => {
			site['index'] = i
			site['tags'] = site.tags.slice(0, 3) // use only first 3
			site['description'] = utils.TextUtils.convertToHtml(site.description)

			site['hasVideo'] = false
			if (site.template.video != null)
				site['hasVideo'] = (site.template.video.length==11) // youtube IDs are 11 characters
		})

		data['templates'] = sites
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			stripe: process.env.STRIPE_PK_LIVE,
			query: req.query,
			user: req.user,
			selected: sites[0],
			templates: sites
			// static: {
			// 	faq: require('../public/static/faq.json')
			// }
		})

		res.render('templates', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/template/:slug', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	// TODO: check if template is live
	controllers.site.get({slug:req.params.slug}) // query template by slug
	.then(results => {
		if (results.length == 0){
			throw new Error('Template not found')
			return
		}

		const site = results[0]
		site['hasVideo'] = hasVideo(site)
		site['description'] = utils.TextUtils.convertToHtml(site.description)
		data['template'] = site
		return (site.cloneSource.length == 0) ? null : controllers.site.getById(site.cloneSource)
	})
	.then(cloneSource => {
		data.template['cloneSource'] = cloneSource
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			template: data.template,
			user: req.user
		})

		res.render('template', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

// blog post
router.get('/post/:slug', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	controllers.post.get({slug:req.params.slug})
	.then(posts => {
		if (posts.length == 0){
			throw new Error('Post '+req.params.slug+' not found.')
			return
		}

		data['post'] = posts[0]
		data['isAuthor'] = (req.user) ? (req.user.id == data.post.author.id) : false
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			post: data.post,
			user: req.user
		})

		res.render('post', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/comments/:slug', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	controllers.comment.get({slug:req.params.slug})
	.then(comments => {
		if (comments.length == 0){
			throw new Error('Comment '+req.params.slug+' not found.')
			return
		}

		data['comment'] = comments[0]
		return controllers.comment.get({thread:data.comment.id, sort:'asc'})
	})
	.then(replies => {
		data['replies'] = replies
		data['profile'] = req.user
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			user: req.user,
			comment: data.comment,
			replies: data.replies
		})

		res.render('comments', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/profile/:slug', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	controllers.profile.get({slug:req.params.slug})
	.then(profiles => {
		if (profiles.length == 0){
			throw new Error('Profile not found')
			return
		}

		data['profile'] = profiles[0]
		data.profile['keywords'] = data.profile.tags.join(', ') // for <meta> tag
		return controllers.site.get({'profile.id':data.profile.id, format:'vertex', origin:'vertex360'})
	})
	.then(sites => {
		data['sites'] = sites
		return controllers.site.get({'collaborators.id':data.profile.id, format:'vertex', origin:'vertex360'})
	})
	.then(sites => {
		sites.forEach(site => {
			data.sites.push(site)
		})

		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			profile: data.profile,
			user: req.user,
			content: {
				templates: data.sites,
				posts: null,
				comments: null
			}
		})

		res.render('profile', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/event/:slug', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	controllers.event.get({slug:req.params.slug})
	.then(events => {
		if (events.length == 0){
			throw new Error('Event '+req.params.slug+' not found.')
			return
		}

		data['event'] = events[0]
		data['profile'] = req.user
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			user: req.user,
			event: data.event
			// comment: data.comment,
			// replies: data.replies
		})

		res.render('event', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/me', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	const allSites = []
	controllers.site.get({'profile.id':req.user.id, format:'vertex', origin:'vertex360'})
	.then(sites => {
		sites.forEach(site => {
			allSites.push(site)
		})

		// Fetch collaborator sites also:
		return controllers.site.get({'collaborators.id':req.user.id, format:'vertex', origin:'vertex360'})
	})
	.then(sites => {
		sites.forEach(site => {
			allSites.push(site)
		})

		const currentUser = {
			id: req.user.id,
			username: req.user.username,
			slug: req.user.slug,
			firstName: req.user.firstName,
			lastName: req.user.lastName,
			image: req.user.image,
			bio: req.user.bio,
			tags: req.user.tags.join(',')
		}

		const data = {
			cdn: CDN,
			sites: allSites,
			user: currentUser
		}

		data['preloaded'] = JSON.stringify({
			user: currentUser,
			sites: allSites,
			selected: req.query.selected || 'profile',
			query: req.query
		})

		res.render('account', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/dashboard', (req, res) => {
	const data = {"user":{"firstName":"denny","lastName":"kwon","slug":"dennykwon2-t2gjis","referrer":"","featured":"no","confirmed":"no","githubId":"","accountType":"basic","email":"dennykwon2@gmail.com","tags":[],"notifications":[],"followers":[],"following":[],"bio":"","username":"dennykwon2","image":"https://lh3.googleusercontent.com/wtsr7fa5uIKV8pzNSwKyPRqcH0fE9nqjyB48pb_-mVPtQN6Gkq6mCzzRmB0n_bdYf9rEtkT9_wglYmT4hLYh8WJr_Wg","activityIndex":0,"promoCode":"","location":{"city":"","state":"","country":""},"lastLogin":null,"timestamp":"2018-12-24T05:45:17.645Z","schema":"profile","id":"5c20726d07f5280017e26074"},"sites":[{"profile":{"id":"5c20726d07f5280017e26074","slug":"dennykwon2-t2gjis","image":"https://lh3.googleusercontent.com/wtsr7fa5uIKV8pzNSwKyPRqcH0fE9nqjyB48pb_-mVPtQN6Gkq6mCzzRmB0n_bdYf9rEtkT9_wglYmT4hLYh8WJr_Wg","username":"dennykwon2","lastName":"kwon","firstName":"denny"},"format":"vertex","collaborators":[],"tags":[],"invited":[],"isClone":"no","cloneSource":"","canClone":"no","featured":"no","published":"no","github":"","slug":"template-test-65-mimyw1","name":"template-test-65","description":"","image":"https://lh3.googleusercontent.com/zcu5RGyy3JbHQkhvMlrT6fjGcrs1TC7Gu0VaIJbCtwCA-vBr_NabfWTt_Sk0YceR59XoLROBANLiSPG6x-XfTlZMOA","images":[],"url":"","api":{"key":"0b866e50-1bc2-4950-b1b9-92c8a1a4be15","secret":""},"pages":["home","blog"],"template":{"category":"misc","status":"dev"},"timestamp":"2019-01-09T08:46:48.755Z","schema":"site","id":"5c35b4f88ad3da0017fd8c71"},{"profile":{"id":"5c20726d07f5280017e26074","slug":"dennykwon2-t2gjis","image":"https://lh3.googleusercontent.com/wtsr7fa5uIKV8pzNSwKyPRqcH0fE9nqjyB48pb_-mVPtQN6Gkq6mCzzRmB0n_bdYf9rEtkT9_wglYmT4hLYh8WJr_Wg","username":"dennykwon2","lastName":"kwon","firstName":"denny"},"format":"vertex","collaborators":[],"tags":[],"invited":[],"isClone":"no","cloneSource":"","canClone":"no","featured":"no","published":"no","github":"","slug":"robert-demo-gjcpze","name":"robert-demo","description":"","image":"https://lh3.googleusercontent.com/zcu5RGyy3JbHQkhvMlrT6fjGcrs1TC7Gu0VaIJbCtwCA-vBr_NabfWTt_Sk0YceR59XoLROBANLiSPG6x-XfTlZMOA","images":[],"url":"","api":{"key":"cecca4fa-154d-45b5-ab54-97cecf58b498","secret":""},"pages":["home","blog"],"template":{"category":"misc","status":"dev"},"timestamp":"2018-12-30T04:44:31.886Z","schema":"site","id":"5c284d2f9017330017094988"}]}

	data['preloaded'] = JSON.stringify({
		user: data.user,
		sites: data.sites,
		selected: req.query.selected || 'profile'
	})

	res.render('account', data)
})

module.exports = router
