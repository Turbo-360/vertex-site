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
    res.render('index', data)
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
