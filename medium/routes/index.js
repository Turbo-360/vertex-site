const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const router = vertex.router()
const controllers = require('../../controllers')
const utils = require('../../utils')
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
		renderAnalytics: renderAnalytics(req)
	}

	controllers.site.get({limit:3, origin:'vertex360', featured:'yes'})
	.then(sites => {
		data['sites'] = sites
		data.sites.forEach(site => {
			site['description'] = utils.TextUtils.truncateText(site.description, 100)
		})

		return controllers.thread.get({limit:6})
	})
  .then(threads => {
    data['threads'] = threads
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			user: sanitizedUser(req.user)
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

router.get('/about', (req, res) => {
	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	res.render('about', data)
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
			// stripe: process.env.STRIPE_PK_LIVE,
			query: req.query,
			user: sanitizedUser(req.user),
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
		data['preloaded'] = JSON.stringify({
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
		renderAnalytics: renderAnalytics(req)
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

		const postsEndpoint = 'https://'+site.slug+'.vertex360.co/api/post'
		return utils.HTTP.get(postsEndpoint, null)
	})
	.then(response => {
		// console.log('RESPOONSE == ' + JSON.stringify(response))
		const parsed = JSON.parse(response) // this comes in as a string so have to parse
		if (parsed.confirmation != 'success'){
			throw new Error(parsed.message)
			return
		}

		data['posts'] = parsed.data
		data.posts.forEach(post => {
			post['link'] = (data.site.url.length==0) ? 'https://'+data.site.slug+'.vertex360.co/post/'+post.slug : 'https://'+data.site.url+'/post/'+post.slug
			delete post['text']
		})

		delete req.user['notifications']
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			user: sanitizedUser(req.user),
			site: data.site,
			posts: data.posts
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
		site['preview'] = utils.TextUtils.truncateText(site.description, 220)
		data['template'] = site
		return (site.cloneSource.length == 0) ? null : controllers.site.getById(site.cloneSource)
	})
	.then(cloneSource => {
		data.template['cloneSource'] = cloneSource
		data['preloaded'] = JSON.stringify({
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

module.exports = router
