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
	const selected = 'landing'
	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	controllers.site.get({'template.status':'live', format:'vertex', limit:3})
	.then(sites => {
		sites.forEach((site, i) => {
			site['hasVideo'] = hasVideo(site)
			site['index'] = i
			site['tags'] = site.tags.slice(0, 3) // use only first 3
			site['description'] = utils.TextUtils.convertToHtml(site.description)
		})

		data['templates'] = sites
		return controllers.post.get({limit:3})
	})
	.then(posts => {
		posts.forEach(post => {
			post['preview'] = utils.TextUtils.truncateText(post.preview, 90)
		})

		data['posts'] = posts
		data['preloaded'] = JSON.stringify({
			referrer: req.vertex_session.referrer, // if undefined, the 'referrer' key doesn't show up at all
			stripe: process.env.STRIPE_PK_LIVE,
			query: req.query,
			user: req.user,
			selected: 'how it works',
			templates: data.templates,
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
			templates: sites,
			static: {
				faq: require('../public/static/faq.json')
			}
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

router.get('/landing', (req, res) => {
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
			stripe: process.env.STRIPE_PK_LIVE,
			query: req.query,
			user: req.user,
			// selected: 'how it works',
			templates: sites,
			static: {
				faq: require('../public/static/faq.json')
			}
		})

		// res.render('landing', data)
		res.render('landing-2', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/blog2', (req, res) => {
	const post = {
"title": "Breaking In",
"tags": [],
"image": "https://lh3.googleusercontent.com/nb0WHNLRQMUozFdLWdIkZuFrcTevG6mf7ro8lQaamjRyzxVRuFkZle9K12XnIOx3PMWbmthnxdua48jZDyVExZQ8kw",
"author": {
"id": "5cd864cf70097e00176b08c7",
"username": "tonyharris1928",
"image": "https://lh3.googleusercontent.com/JCol3p6K2XkHdxJk5laDl6JlGJaGc12HI_6pso9LLj0uQxIyW10wNun5rsG4SJ7RaLUpUVePPdr2gqadILgZ2LJFMv4",
"slug": "emailtabitha1928-gserkr",
"firstName": "anthony",
"lastName": "harris",
"bio": "I am a software engineer focusing on node, express, javascript, react, and react native. I mostly build MVP's for early stage startups in Silicon Valley. "
},
"preview": "My first line of code was written in 2010, not that long ago. Before then, I had no computer science experience whatsoever. In fact, I was an Econ major in college on the path to becoming a math teach...",
"text": "<p>My first line of code was written in 2010, not that long ago. Before then, I had no computer science experience whatsoever. In fact, I was an Economics major in college on the path to becoming a math teacher. I quickly realized that this was not the career path of my choice, and I looked for another endeavor.</p><p><br></p><h3>The Next Big Thing</h3><p><a href=\"https://lh3.googleusercontent.com/X1cIyAGxZys5Y6LUCCmK1xOYcfiBoojT205XZk_7NoQxC-GqzGnSfV-Be1O-E9pF_zzqlm4_unKGnU-CanTTpbGg7TM=s2048\" target=\"_blank\"><img src=\"https://lh3.googleusercontent.com/X1cIyAGxZys5Y6LUCCmK1xOYcfiBoojT205XZk_7NoQxC-GqzGnSfV-Be1O-E9pF_zzqlm4_unKGnU-CanTTpbGg7TM\" style=\"width: 50%;\"></a><br></p><p>In 2010, the biggest thing in mainstream news was the iPhone. It was taking over the world. It didn’t take a genius to identify that iPhone programming would be the perfect back door into the tech scene. Considering its popularity and potential, I made the calculated decision to teach myself iPhone programming for the next year and a half until I could consider myself a pro… or so I thought.</p><p><br></p><p>Once I moved to NYC and actually began programming as my career, I realized that I was nowhere near the professional level I thought I was. I made my first connections with other programmers through craigslist and co-working space meet-ups. My first gig was actually teaching someone from one of these meet-ups the iPhone programming that I had taught myself for the past 2 years. Turns out, he worked as a product manager for a developer shop in Brooklyn. After building our professional relationship, he got me an interview with his boss, and I got hired. Working with this company on one of their huge corporate projects (a successful and commonly used iPhone app) gave me the professional coding experience I was lacking. I now had plenty of knowledge, credibility, and legitimacy to be a successful freelancer. Having my name attached to this highly successful iOS app led everything to fall into place.</p><p><br></p><h3>Decisions, Decisions.</h3><p>Let’s rewind to the first two years of my coding journey. There is one decision I made that set everything into place for the rest of my career: iPhone programming. I didn’t get lucky and happen to fall into the most booming business at the time – it was an extremely calculated decision with 2 key things in mind:&nbsp;</p><p><br></p><h4>1. New Industries</h4><p>Since, at the time, the iPhone was only 2 years old, there were no programmers who had more than 2 years of experience. That put me at an even playing field with everyone else. It was literally impossible that I would have to face competition with more experience than 2 years, which made iPhone programming the perfect thing to get into for a beginner. Getting involved in other technologies that have been around since the 90’s would have left me facing competitors with years and years of experience. I would never be able to catch up. The iPhone was the perfect point of entry.</p><p><br></p><h4>2. High Growth Industries</h4><p>As I said, the iPhone was the hottest thing at the time. The people who owned iPhones were the lawyers, doctors, and hedge fund hot-shots. My background in business helped me realize that along with the sudden popularity of iPhones was bound to come a huge influx of iPhone startups. From 2010-2014, iPhone apps were HUGE, which perfectly fueled the demand for people like me. Many people wanted iPhones, and as a result, many people wanted iOS programmers.&nbsp;</p><p><br></p><h3>High in Demand, Low in Supply</h3><p>The reason I haven’t looked back since the first day I moved to NYC is because I focused on areas that were high in demand and low in supply. I identified a high growth industry that was lacking the programmers to fulfill its demand.&nbsp;</p><p><br></p><p>If you’re a freelancer in another industry such as writing, design, etc., can the same mindset be applied? The answer is yes, and it always will be. New products, technologies, and strategies are constantly emerging at a rapid pace, creating a demand for people who don’t have experience in those skills yet. If you can find this dynamic occurring in the industry you wish to enter, use it as an opportunity to break in. Once you do that, you can build your skills and credibility needed to really launch your career.&nbsp;</p><p><a href=\"https://lh3.googleusercontent.com/6zIsFI94swUt4wQeixp1E7rD9hTDB_Vb7ahWod9nKEXaLUo5VNusig51a-Tj-Ui1N8_gzeObFCjz1Q9CVsHpnhHptQ=s2048\" target=\"_blank\"><img src=\"https://lh3.googleusercontent.com/6zIsFI94swUt4wQeixp1E7rD9hTDB_Vb7ahWod9nKEXaLUo5VNusig51a-Tj-Ui1N8_gzeObFCjz1Q9CVsHpnhHptQ\"></a><br></p><h3><br></h3><h3>Give the People What They Want</h3><p>Let’s say you are a freelance writer. An example of a high demand/low supply industry might be influencer marketing. Now that Instagram and YouTube are taking over the social media realm, influencer marketing is a massive industry. As a writer, you can be the person to turn a popular YouTube video into copy write content for a blog post. You could also provide a wide array of business professionals with SEO maximization copy write – something that all business need in today’s age.&nbsp;</p><p><br></p><p>The general principle is, identify what the masses want that they can’t find easily, and provide it. Find a product or industry that is emerging in success and fulfill the demand that it is currently lacking. No matter what realm of business you may be trying to get into, finding the perfect place to break in is all you need to become the established professional you aim to be.&nbsp;</p><style>\n<!--\n /* Font Definitions */\n @font-face\n\t{font-family:\"Cambria Math\";\n\tpanose-1:2 4 5 3 5 4 6 3 2 4;\n\tmso-font-charset:0;\n\tmso-generic-font-family:roman;\n\tmso-font-pitch:variable;\n\tmso-font-signature:3 0 0 0 1 0;}\n@font-face\n\t{font-family:Calibri;\n\tpanose-1:2 15 5 2 2 2 4 3 2 4;\n\tmso-font-charset:0;\n\tmso-generic-font-family:swiss;\n\tmso-font-pitch:variable;\n\tmso-font-signature:-536859905 -1073732485 9 0 511 0;}\n /* Style Definitions */\n p.MsoNormal, li.MsoNormal, div.MsoNormal\n\t{mso-style-unhide:no;\n\tmso-style-qformat:yes;\n\tmso-style-parent:\"\";\n\tmargin:0in;\n\tmargin-bottom:.0001pt;\n\tmso-pagination:widow-orphan;\n\tfont-size:12.0pt;\n\tfont-family:\"Calibri\",sans-serif;\n\tmso-ascii-font-family:Calibri;\n\tmso-ascii-theme-font:minor-latin;\n\tmso-fareast-font-family:Calibri;\n\tmso-fareast-theme-font:minor-latin;\n\tmso-hansi-font-family:Calibri;\n\tmso-hansi-theme-font:minor-latin;\n\tmso-bidi-font-family:\"Times New Roman\";\n\tmso-bidi-theme-font:minor-bidi;}\np.MsoListParagraph, li.MsoListParagraph, div.MsoListParagraph\n\t{mso-style-priority:34;\n\tmso-style-unhide:no;\n\tmso-style-qformat:yes;\n\tmargin-top:0in;\n\tmargin-right:0in;\n\tmargin-bottom:0in;\n\tmargin-left:.5in;\n\tmargin-bottom:.0001pt;\n\tmso-add-space:auto;\n\tmso-pagination:widow-orphan;\n\tfont-size:12.0pt;\n\tfont-family:\"Calibri\",sans-serif;\n\tmso-ascii-font-family:Calibri;\n\tmso-ascii-theme-font:minor-latin;\n\tmso-fareast-font-family:Calibri;\n\tmso-fareast-theme-font:minor-latin;\n\tmso-hansi-font-family:Calibri;\n\tmso-hansi-theme-font:minor-latin;\n\tmso-bidi-font-family:\"Times New Roman\";\n\tmso-bidi-theme-font:minor-bidi;}\np.MsoListParagraphCxSpFirst, li.MsoListParagraphCxSpFirst, div.MsoListParagraphCxSpFirst\n\t{mso-style-priority:34;\n\tmso-style-unhide:no;\n\tmso-style-qformat:yes;\n\tmso-style-type:export-only;\n\tmargin-top:0in;\n\tmargin-right:0in;\n\tmargin-bottom:0in;\n\tmargin-left:.5in;\n\tmargin-bottom:.0001pt;\n\tmso-add-space:auto;\n\tmso-pagination:widow-orphan;\n\tfont-size:12.0pt;\n\tfont-family:\"Calibri\",sans-serif;\n\tmso-ascii-font-family:Calibri;\n\tmso-ascii-theme-font:minor-latin;\n\tmso-fareast-font-family:Calibri;\n\tmso-fareast-theme-font:minor-latin;\n\tmso-hansi-font-family:Calibri;\n\tmso-hansi-theme-font:minor-latin;\n\tmso-bidi-font-family:\"Times New Roman\";\n\tmso-bidi-theme-font:minor-bidi;}\np.MsoListParagraphCxSpMiddle, li.MsoListParagraphCxSpMiddle, div.MsoListParagraphCxSpMiddle\n\t{mso-style-priority:34;\n\tmso-style-unhide:no;\n\tmso-style-qformat:yes;\n\tmso-style-type:export-only;\n\tmargin-top:0in;\n\tmargin-right:0in;\n\tmargin-bottom:0in;\n\tmargin-left:.5in;\n\tmargin-bottom:.0001pt;\n\tmso-add-space:auto;\n\tmso-pagination:widow-orphan;\n\tfont-size:12.0pt;\n\tfont-family:\"Calibri\",sans-serif;\n\tmso-ascii-font-family:Calibri;\n\tmso-ascii-theme-font:minor-latin;\n\tmso-fareast-font-family:Calibri;\n\tmso-fareast-theme-font:minor-latin;\n\tmso-hansi-font-family:Calibri;\n\tmso-hansi-theme-font:minor-latin;\n\tmso-bidi-font-family:\"Times New Roman\";\n\tmso-bidi-theme-font:minor-bidi;}\np.MsoListParagraphCxSpLast, li.MsoListParagraphCxSpLast, div.MsoListParagraphCxSpLast\n\t{mso-style-priority:34;\n\tmso-style-unhide:no;\n\tmso-style-qformat:yes;\n\tmso-style-type:export-only;\n\tmargin-top:0in;\n\tmargin-right:0in;\n\tmargin-bottom:0in;\n\tmargin-left:.5in;\n\tmargin-bottom:.0001pt;\n\tmso-add-space:auto;\n\tmso-pagination:widow-orphan;\n\tfont-size:12.0pt;\n\tfont-family:\"Calibri\",sans-serif;\n\tmso-ascii-font-family:Calibri;\n\tmso-ascii-theme-font:minor-latin;\n\tmso-fareast-font-family:Calibri;\n\tmso-fareast-theme-font:minor-latin;\n\tmso-hansi-font-family:Calibri;\n\tmso-hansi-theme-font:minor-latin;\n\tmso-bidi-font-family:\"Times New Roman\";\n\tmso-bidi-theme-font:minor-bidi;}\n.MsoChpDefault\n\t{mso-style-type:export-only;\n\tmso-default-props:yes;\n\tfont-family:\"Calibri\",sans-serif;\n\tmso-ascii-font-family:Calibri;\n\tmso-ascii-theme-font:minor-latin;\n\tmso-fareast-font-family:Calibri;\n\tmso-fareast-theme-font:minor-latin;\n\tmso-hansi-font-family:Calibri;\n\tmso-hansi-theme-font:minor-latin;\n\tmso-bidi-font-family:\"Times New Roman\";\n\tmso-bidi-theme-font:minor-bidi;}\n@page WordSection1\n\t{size:8.5in 11.0in;\n\tmargin:1.0in 1.0in 1.0in 1.0in;\n\tmso-header-margin:.5in;\n\tmso-footer-margin:.5in;\n\tmso-paper-source:0;}\ndiv.WordSection1\n\t{page:WordSection1;}\n /* List Definitions */\n @list l0\n\t{mso-list-id:1253705365;\n\tmso-list-type:hybrid;\n\tmso-list-template-ids:-130238958 67698703 67698713 67698715 67698703 67698713 67698715 67698703 67698713 67698715;}\n@list l0:level1\n\t{mso-level-tab-stop:none;\n\tmso-level-number-position:left;\n\ttext-indent:-.25in;}\n@list l0:level2\n\t{mso-level-number-format:alpha-lower;\n\tmso-level-tab-stop:none;\n\tmso-level-number-position:left;\n\ttext-indent:-.25in;}\n@list l0:level3\n\t{mso-level-number-format:roman-lower;\n\tmso-level-tab-stop:none;\n\tmso-level-number-position:right;\n\ttext-indent:-9.0pt;}\n@list l0:level4\n\t{mso-level-tab-stop:none;\n\tmso-level-number-position:left;\n\ttext-indent:-.25in;}\n@list l0:level5\n\t{mso-level-number-format:alpha-lower;\n\tmso-level-tab-stop:none;\n\tmso-level-number-position:left;\n\ttext-indent:-.25in;}\n@list l0:level6\n\t{mso-level-number-format:roman-lower;\n\tmso-level-tab-stop:none;\n\tmso-level-number-position:right;\n\ttext-indent:-9.0pt;}\n@list l0:level7\n\t{mso-level-tab-stop:none;\n\tmso-level-number-position:left;\n\ttext-indent:-.25in;}\n@list l0:level8\n\t{mso-level-number-format:alpha-lower;\n\tmso-level-tab-stop:none;\n\tmso-level-number-position:left;\n\ttext-indent:-.25in;}\n@list l0:level9\n\t{mso-level-number-format:roman-lower;\n\tmso-level-tab-stop:none;\n\tmso-level-number-position:right;\n\ttext-indent:-9.0pt;}\nol\n\t{margin-bottom:0in;}\nul\n\t{margin-bottom:0in;}\n-->\n</style>",
"slug": "breaking-in-gxhlr4",
"isPublic": "no",
"numReplies": 0,
"link": "",
"type": "original",
"votes": {
"up": 0,
"down": 0,
"score": 0
},
"thread": "",
"dateString": "June 20th, 2019",
"timestamp": "2019-06-20T20:21:17.945Z",
"schema": "post",
"id": "5d0beabd3f8a4f0017b0a0d1"
}
	const data = {
		cdn: CDN,
		post: post,
		renderAnalytics: renderAnalytics(req)
	}

	res.render('blog2', data)
})

module.exports = router
