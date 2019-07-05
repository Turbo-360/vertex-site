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

router.get('/', (req, res) => {
  const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

  controllers.post.get({limit:6})
  .then(posts => {
    data['posts'] = posts
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			query: req.query,
			user: req.user
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
    res.render('article', data)
  })
  .catch(err => {
    res.json({
      confirmation: 'fail',
      message: err.message
    })
  })

})


module.exports = router
