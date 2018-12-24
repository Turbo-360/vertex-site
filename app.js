// Full Documentation - https://www.turbo360.co/docs
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const controllers = require('./controllers')

const config = {
	session: {
		cookieName: 'session',
		secret: process.env.SESSION_SECRET,
		duration: 14*24*60*60*1000, // 14 days
	  activeDuration:30*60*1000
	},
	db: {
		url: process.env.MONGODB_URI,
		type: 'mongo',
		onError: (err) => {
			console.log('DB Connection Failed!')
		},
		onSuccess: () => {
			console.log('DB Successfully Connected!')
		}
	}
}

const app = vertex.app(config)


app.use((req, res, next) => {
  if (req.session == null)
    return next()

  if (req.session.user == null)
    return next()

  controllers.profile.getById(req.session.user)
  .then(user => {
    req.user = user
    return next()
  })
  .catch(err => { // should probably clear session here:
    return next()
  })
})

const index = require('./routes/index')
const api = require('./routes/api')
const account = require('./routes/account')

app.use('/', index)
app.use('/api', api)
app.use('/account', account)

module.exports = app
