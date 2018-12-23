// Full Documentation - https://www.turbo360.co/docs
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})

const config = {
	// views: 'views',
	// static: 'public', 		// Set static assets directory
	db: { 					// Database configuration. Remember to set env variables in .env file: MONGODB_URI, PROD_MONGODB_URI
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

const app = vertex.app(config) // initialize app with config options



// import routes
const index = require('./routes/index')
const api = require('./routes/api')
const account = require('./routes/account')

// set routes
app.use('/', index)
app.use('/api', api)
app.use('/account', account)


module.exports = app
