// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const router = vertex.router()
const controllers = require('../controllers')
const utils = require('../utils')
const CDN = (process.env.TURBO_ENV=='dev') ? null : process.env.CDN_ROOT

const templates = {}
const categories = ['landing', 'resume', 'restaurant', 'fitness', 'realtor', 'lessons']


router.get('/', (req, res) => {
	const selected = categories[0]
	const data = {
		categories: categories,
		cdn: CDN
	}

	controllers.site.get({'template.status':'live', format:'vertex', sort:'asc'})
	.then(sites => {
		sites.forEach((site, i) => {
			site['index'] = i
			site['tags'] = site.tags.slice(0, 3) // use only first 3
			site['description'] = utils.TextUtils.convertToHtml(site.description)
		})

		templates[selected] = sites
		data['templates'] = sites
		data['preloaded'] = JSON.stringify({
			query: req.query,
			user: req.user,
			selected: 'how it works',
			templates: sites,
			static: {
				faq: require('../public/static/faq.json')
			}
		})

		res.render('index', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/blog', (req, res) => {
	const data = {
		cdn: CDN
	}


	data['preloaded'] = JSON.stringify({
		query: req.query,
		user: req.user
	})


	res.render('blog', data)
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

router.get('/templates', (req, res) => {
	const data = {cdn: CDN}
	controllers.site.get({'template.status':'live', format:'vertex', sort:'asc'})
	.then(sites => {
		sites.forEach((site, i) => {
			site['description'] = utils.TextUtils.truncateText(site.description, 26)
		})

		data['templates'] = sites
		data['preloaded'] = JSON.stringify({
			user: req.user,
			templates: sites
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
	const data = {cdn: CDN}

	// TODO: check if template is live
	controllers.site.get({slug:req.params.slug}) // query template by slug
	.then(results => {
		if (results.length == 0){
			throw new Error('Template not found')
			return
		}

		const site = results[0]
		site['description'] = utils.TextUtils.convertToHtml(site.description)
		data['template'] = site
		data['preloaded'] = JSON.stringify({
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
	const data = {cdn: CDN}

	controllers.post.get({slug:req.params.slug})
	.then(posts => {
		if (posts.length == 0){
			throw new Error('Post '+req.params.slug+' not found.')
			return
		}

		data['post'] = posts[0]
		data['preloaded'] = JSON.stringify({
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

router.get('/profile/:slug', (req, res) => {
	const data = {cdn: CDN}
	controllers.profile.get({slug:req.params.slug})
	.then(profiles => {
		if (profiles.length == 0){
			throw new Error('Profile not found')
			return
		}

		data['profile'] = profiles[0]
		data.profile['keywords'] = data.profile.tags.join(', ') // for <meta> tag
		return controllers.site.get({'profile.id':data.profile.id, format:'vertex'})
	})
	.then(sites => {
		data['sites'] = sites
		return controllers.site.get({'collaborators.id':data.profile.id, format:'vertex'})
	})
	.then(sites => {
		sites.forEach(site => {
			data.sites.push(site)
		})

		data['preloaded'] = JSON.stringify({
			profile: data.profile,
			user: req.user
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

router.get('/landing', (req, res) => {
	const data = {
		categories: categories,
		cdn: CDN
	}

	res.render('landing', data)
})

module.exports = router
