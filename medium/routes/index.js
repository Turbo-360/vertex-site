const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const router = vertex.router()
const controllers = require('../../controllers')
const utils = require('../../utils')
const CDN = (process.env.TURBO_ENV=='dev') ? null : process.env.CDN_ROOT


const hasVideo = (site) => {
	if (site.template.video == null)
		return false

	return (site.template.video.length==11) // youtube IDs are 11 characters;
}

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


router.get('/', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

	data['preloaded'] = JSON.stringify({
		timestamp: req.timestamp,
		user: sanitizedUser(req.user),
		query: req.query
	})

	res.render('about', data)
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
			timestamp: req.timestamp,
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			threads: data.threads,
			user: sanitizedUser(req.user)
		})

		const template = (req.isMobile) ? 'mobile-feed' : 'feed-2'
		data['meta'] = {
			title: 'Vertex 360',
			url: 'https://www.vertex360.co/',
			image: 'https://lh3.googleusercontent.com/ZM_FCvAPcwUXd3NZJNpvA-t8jb4RQkkjVAKNXYk_SQHV155T-W36Ghos9W7iiTyxaiKzXl9Z2XhaABotatD3HomhAQ',
			description: 'Stay up to date with the latest entertainment, politics, sports news and more.'
		}

    res.render(template, data)
  })
  .catch(err => {
    res.json({
      confirmation: 'fail',
      message: err.message
    })
  })
})

// redirects (old links that use to work):
router.get('/about', (req, res) => {
	res.redirect('/')
})

router.get('/blog', (req, res) => {
	res.redirect('https://blog.vertex360.co')
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

		const currentUser = sanitizedUser(req.user)
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

router.get('/templates', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

	controllers.site.get({'template.status':'live', format:'vertex', featured:'yes'})
	.then(sites => {
		const templatesMap = {}
		sites.forEach((site, i) => {
			site['features'] = site.tags.join(' ').toLowerCase()
			site['description'] = utils.TextUtils.convertToHtml(site.description)
			templatesMap[site.id] = site
		})

		data['templates'] = sites
		data['preloaded'] = JSON.stringify({
			timestamp: req.timestamp,
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			user: sanitizedUser(req.user),
			templates: sites,
			templatesMap: templatesMap
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

router.get('/comments', (req, res) => {
	const thread = req.query.thread
	if (thread == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing thread parameter'
		})
		return
	}

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

	const data = {
		cdn: CDN,
		renderAnalytics: false
		// renderAnalytics: utils.renderAnalytics(req, CDN)
	}

	controllers.site.get({slug:site})
	.then(sites => {
		if (sites.length == 0){
			throw new Error('Site '+site+' not found')
			return
		}

		const currentUser = sanitizedUser(req.user)
		data['preloaded'] = JSON.stringify({
			timestamp: req.timestamp,
			user: currentUser,
			site: sites[0],
			thread: thread,
			schema: schema
		})

		res.render('thread', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})

	// const endpoint = 'https://'+site+'.vertex360.co/api/'+schema+'/'+thread
	// utils.HTTP.get(endpoint)
	// .then(response => {
	// 	const parsed = JSON.parse(response)
	// 	data['entity'] = parsed.data
	//
	// 	// fetch comments based on type and id query params
	// 	return controllers.comment.get({thread:thread})
	// })
	// .then(comments => {
	// 	const currentUser = sanitizedUser(req.user)
	// 	data['comments'] = comments
	// 	data['user'] = currentUser
	// 	data['preloaded'] = JSON.stringify({
	// 		comments: comments,
	// 		user: currentUser,
	// 		entity: data.entity,
	// 		thread: thread
	// 	})
	//
	//   res.render('thread', data)
	// })
	// .catch(err => {
	// 	res.json({
	// 		confirmation: 'fail',
	// 		message: err.message
	// 	})
	// })
})

/*
router.get('/feed/:slug', (req, res) => {
  const data = {
		cdn: CDN,
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

	controllers.thread.get({limit:50})
  .then(threads => {
    data['threads'] = threads

		const threadsMap = {}
		let selectedIndex = 0
		threads.forEach((thread, i) => {
			if (thread.subject.slug == req.params.slug){
				selectedIndex = i
				data['meta'] = {
					title: thread.subject.title,
					description: thread.subject.preview,
					image: thread.subject.image,
					url: 'https://www.vertex360.co/feed/'+req.params.slug
				}
			}

			threadsMap[thread.id] = thread
			threadsMap[thread.slug] = thread
		})

		data['threadsMap'] = threadsMap
		data['selectedIndex'] = selectedIndex
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			showSidebar: false,
			threads: data.threads,
			threadsMap: data.threadsMap,
			selectedIndex: data.selectedIndex,
			user: sanitizedUser(req.user)
		})

		const template = (req.isMobile) ? 'mobile-feed' : 'feed'
    res.render(template, data)
  })
  .catch(err => {
    res.json({
      confirmation: 'fail',
      message: err.message
    })
  })
}) */

router.get('/feed/:slug', (req, res) => {
  const data = {
		cdn: CDN,
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

	// controllers.thread.get({'subject.slug':req.params.slug})
	controllers.thread.get({'slug':req.params.slug})
  .then(threads => {
		if (threads.length == 0){
			throw new Error('Not Found')
			return
		}

    data['thread'] = threads[0]
		return controllers.comment.get({thread:data.thread.subject.id})
  })
	.then(comments => {
		data['comments'] = comments
		data['preloaded'] = JSON.stringify({
			timestamp: req.timestamp,
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			thread: data.thread,
			comments: data.comments,
			user: sanitizedUser(req.user)
		})

		res.render('thread', data)
	})
  .catch(err => {
    res.json({
      confirmation: 'fail',
      message: err.message
    })
  })
})

router.get('/post/:slug', (req, res) => {
  const data = {
		cdn: CDN,
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

  controllers.post.get({slug:req.params.slug})
  .then(posts => {
    if (posts.length == 0){
      throw new Error('Post '+req.params.slug+' not found.')
      return
    }

    data['post'] = posts[0]
		data['preloaded'] = JSON.stringify({
			timestamp: req.timestamp,
			post: data.post,
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			user: sanitizedUser(req.user)
		})

    res.render('article', data)
  })
  .catch(err => {
    res.json({
      confirmation: 'fail',
      message: err.message
    })
  })
})

router.get('/site/:slug', (req, res) => {
  const data = {
		cdn: CDN,
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

	controllers.site.get({slug:req.params.slug}) // query template by slug
	.then(results => {
		if (results.length == 0){
			throw new Error('Template not found')
			return
		}

		const site = results[0]
		site['description'] = utils.TextUtils.convertToHtml(site.description)
		site['preview'] = utils.TextUtils.truncateText(site.description, 220)
		data['site'] = site
		site['link'] = (site.url.length==0) ? 'https://'+site.slug+'.vertex360.co' : 'https://'+site.url

		// const postsEndpoint = 'https://'+site.slug+'.vertex360.co/api/post'
		// return utils.HTTP.get(postsEndpoint, null)
		data['preloaded'] = JSON.stringify({
			timestamp: req.timestamp,
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			user: sanitizedUser(req.user),
			site: data.site
		})

		res.render('site', data)
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
		renderAnalytics: utils.renderAnalytics(req, CDN)
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
		site['preview'] = utils.TextUtils.truncateText(site.description, 220)
		data['template'] = site
		return (site.cloneSource.length == 0) ? null : controllers.site.getById(site.cloneSource)
	})
	.then(cloneSource => {
		data.template['cloneSource'] = cloneSource
		data['preloaded'] = JSON.stringify({
			timestamp: req.timestamp,
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			template: data.template,
			user: sanitizedUser(req.user)
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

router.get('/comments/:slug', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: utils.renderAnalytics(req, CDN)
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
			timestamp: req.timestamp,
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			user: sanitizedUser(req.user),
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
		renderAnalytics: utils.renderAnalytics(req, CDN)
	}

	controllers.profile.get({slug:req.params.slug})
	.then(profiles => {
		if (profiles.length == 0){
			throw new Error('Profile '+req.params.slug+' not found.')
			return
		}

		data['profile'] = profiles[0]
		return controllers.site.get({'profile.id':data.profile.id, format:'vertex', origin:'vertex360'})
	})
	.then(sites => {
		const templatesMap = {}
		sites.forEach((site, i) => {
			site['features'] = site.tags.join(' ').toLowerCase()
			site['description'] = utils.TextUtils.convertToHtml(site.description)
			templatesMap[site.id] = site
		})

		data['templates'] = sites
		data['preloaded'] = JSON.stringify({
			timestamp: req.timestamp,
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			// stripe: process.env.STRIPE_PK_LIVE,
			query: req.query,
			user: sanitizedUser(req.user),
			templates: sites,
			templatesMap: templatesMap
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

module.exports = router
