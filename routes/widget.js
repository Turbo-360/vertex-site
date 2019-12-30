// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const moment = require('moment')
const router = vertex.router()
const controllers = require('../controllers')
const utils = require('../utils')
const CDN = (process.env.TURBO_ENV=='dev') ? null : process.env.CDN_ROOT

const sanitizedUser = (user) => {
	if (user == null)
		return null

	var currentUser = {
		id: user.id,
		username: user.username,
		slug: user.slug,
		firstName: user.firstName,
		lastName: user.lastName,
		image: user.image,
		bio: user.bio,
		tags: user.tags.join(',')
	}

	return currentUser
}

// router.get('/apps', (req, res) => {
// 	const apps = [
//     {name:'Comments', description:'View comments or leave a comment on this site.', image:'https://lh3.googleusercontent.com/LguTYWcYVsAQIIIiblHARcuoRYsSKjh14YuJHYSXWsEXASdeJUqtOjU4L9YNArhrcNDKJYc9wWKU9OySrY9cvxhdyg'},
//     {name:'Feed', description:'View related news, videos, blog posts from other sites similar to this one.', image:'https://lh3.googleusercontent.com/VRci17sHyXHKc-XswotXk6zs7DXEF8zfuZbA_Tm189C-2c53I_sIqYDhWru_US1HfojEhczOTVauVmZRT5-63Mrn'},
//     {name:'Store', description:'Purchase items sold on this site using PayPal or credit card.', image:'https://lh3.googleusercontent.com/YTbGgxpsFQDjTj5JQ3zF2lBFYIlb0bSkO4Kev9Y6zcr_7XPU034Qi2bCC-sgTtHWbojztJ6ddD9t7Gi_SN0O4enAxjs'}
//   ]
//
// 	const profile = {
// 		id: '0',
// 		firstName: 'Vertex',
// 		lastName: '360',
// 		username: 'vertex360',
// 		image: 'https://lh3.googleusercontent.com/9BBnktlJDxKkD49ollfnTr5OQ6KgDMx-fCsE_8vDcGvBVVYxW8yZdCgv61SYTz40jdBhQ561usRmfRsAUvmpsoQlBA',
// 		slug: 'vertex360'
// 	}
//
// 	apps.forEach(app => {
// 		app['profile'] = profile
// 		controllers.app.post(app)
// 		.then(data => {})
// 		.catch(err => {})
// 	})
//
// 	res.json({
// 		confirmation:'success',
// 		data:apps
// 	})
//
// })

router.get('/comments', (req, res) => {
	const thread = req.query.thread
	if (thread == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing thread parameter'
		})
		return
	}

	// post, video, episode, etc
	const schema = req.query.schema
	if (schema == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing schema parameter'
		})
		return
	}

	// this is the site slug NOT id:
	const site = req.query.site
	if (site == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing site parameter'
		})
		return
	}

	// readonly or comment
	const format = req.query.format || 'readonly'

	const data = {
		cdn: CDN,
		user: null, // always set user from the host site, not vertex360.co
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

	let currentSite = null
	controllers.site.get({slug:site})
	.then(sites => {
		if (sites.length == 0){
			throw new Error('Site ' + site + ' not found')
			return
		}

		currentSite = sites[0]
		const commentsFilter = (schema==='site') ? {'site.id':currentSite.id} : {thread:thread, 'site.id':currentSite.id}
		return controllers.comment.get(commentsFilter)
	})
	.then(comments => {
		const commentsMap = {}
		const repliesMap = {}
		const filteredComments = []
		comments.forEach(comment => {
			commentsMap[comment.id] = comment

			// this is a reply to another comment
			if (comment.context.schema == 'comment'){
				const originalCommentId = comment.context.id
				const repliesArray = repliesMap[originalCommentId] || []
				repliesArray.unshift(comment)
				repliesMap[originalCommentId] = repliesArray
			}
			else {
				comment['replies'] = repliesMap[comment.id] || null
				filteredComments.push(comment)
			}
		})

		console.log(JSON.stringify(comments))

		data['preloaded'] = JSON.stringify({
			isWidget: true,
			onLoginRedirect: 'reload',
			onRegisterRedirect: 'reload',
			timestamp: req.timestamp,
			// comments: comments,
			comments: filteredComments,
			commentsMap: commentsMap,
			user: data.user,
			site: currentSite,
			thread: thread, // this is the thread ID number
			schema: schema,
			format: format,
			token: req.query.token || null
		})

		res.render('widget/comments', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/feed', (req, res) => {
  const data = {
		cdn: CDN,
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

	controllers.thread.get({limit:50})
  .then(threads => {
		data['threads'] = {recent:threads}
		data['preloaded'] = JSON.stringify({
			isWidget: true,
			timestamp: req.timestamp,
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			threads: data.threads,
			user: sanitizedUser(req.user)
		})

		// const template = (req.isMobile) ? 'mobile-feed' : 'feed-2'
		// data['meta'] = {
		// 	title: 'Vertex 360',
		// 	url: 'https://www.vertex360.co/',
		// 	image: 'https://lh3.googleusercontent.com/ZM_FCvAPcwUXd3NZJNpvA-t8jb4RQkkjVAKNXYk_SQHV155T-W36Ghos9W7iiTyxaiKzXl9Z2XhaABotatD3HomhAQ',
		// 	description: 'Stay up to date with the latest entertainment, politics, sports news and more.'
		// }

    res.render('widget/feed', data)
  })
  .catch(err => {
    res.json({
      confirmation: 'fail',
      message: err.message
    })
  })
})

router.get('/store', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

 	// Site ID
	const site = req.query.site
	if (site == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing site parameter'
		})
		return
	}

	controllers.item.get({'site.id':site})
	.then(items => {
		data['items'] = items
		data['preloaded'] = JSON.stringify({
			isWidget: true,
			timestamp: req.timestamp
		})

		res.render('widget/store', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/item/:id', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

	controllers.item.getById(req.params.id)
	.then(item => {
		data['item'] = item
		return controllers.site.getById(item.site.id, null, 'admin')
	})
	.then(site => {
		if (site.paypal.clientId.length == 0){
			throw new Error('Missing PayPal Credentials')
			return
		}

		if (site.paypal.clientSecret.length == 0){
			throw new Error('Missing PayPal Credentials')
			return
		}

		site['paypal'] = {clientId:site.paypal.clientId}
		data['site'] = site
		data['preloaded'] = JSON.stringify({
			isWidget: true,
			timestamp: req.timestamp,
			item: data.item,
			site: data.site
		})

		res.render('widget/item', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/seed-comments', (req, res) => {
	const yt = req.query.yt // yt video ID
	if (yt==null){
		res.json({
			confirmation: 'fail',
			message: 'Missing yt parameter'
		})
		return
	}

	const entity = req.query.entity // blog post ID
	if (entity==null){
		res.json({
			confirmation: 'fail',
			message: 'Missing entity parameter'
		})
		return
	}

	// fetch YT comments
	const endpoint = 'https://storage.turbo360.co/demo-test-vxqkks/'+yt+'.json'
	utils.HTTP.get(endpoint, null, {'Accept':'application/json'})
	.then(response => { //comes in as a string
		console.log('RESPONSE == ' + response)
		const payload = JSON.parse(response)
		if (payload.confirmation != 'success'){
			throw new Error(payload.message)
			return
		}

		const comments = payload.data.comments
		const vertexComments = []
		comments.forEach(comment => {
			const nameParts = comment.author.split(' ')
			const timestamp = new Date(comment.timestamp)

			const formatted = {
				profile: {
					id: comment.id.toLowerCase(),
					firstName:'',
					lastName: '',
					username:nameParts[0].toLowerCase(),
					image: comment.authorThumb,
					slug:nameParts[0].toLowerCase()+'-'+comment.id.toLowerCase().substring(0, 6)
				},
				timestamp: timestamp,
				dateString: moment(timestamp).format("MMMM Do, YYYY"), // human readable date:
				text: comment.text,
				isInitial: 'no',
				thread: entity
			}

			vertexComments.push(formatted)
			controllers.comment.post(formatted)
		})

		res.json({
			confirmation: 'success',
			data: vertexComments
		})
	})
	.catch(err => {
		console.log('ERR: ' + err)
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

module.exports = router
