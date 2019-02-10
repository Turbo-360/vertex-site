const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const sessions = require('client-sessions')
const mongoose = require('mongoose')
const compression = require('compression')
const controllers = require('./controllers')
require('dotenv').config()

// mpromise (mongoose's default promise library) is deprecated,
// plug in your own promise library instead: http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird')

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true})
.then(data => {
  console.log ('DB Connection success')
})
.catch(err => {
  console.log ('DB Connection ERROR: ' + err)
})


const app = express()
app.use(compression())


// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'mustache')
app.engine('mustache', require('hogan-middleware').__express)

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
const allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  // res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, '+process.env.TURBO_HEADER)
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, ' + process.env.TURBO_HEADER + ', ' + process.env.TURBO_APP_ID_HEADER)

  // intercept OPTIONS method
  if ('OPTIONS' == req.method)
    res.send(200)
  else
    next()
}

app.use(allowCrossDomain)
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(sessions({
  cookieName: 'vertex_session',
  secret: process.env.SESSION_SECRET,
  duration: 14*24*60*60*1000, // 14 days
  activeDuration:30*60*1000,
  cookie: {
   domain: (process.env.ENVIRONMENT=='dev') ? 'localhost' : '.vertex360.co'
  }
}))

app.use(express.static(path.join(__dirname, 'public')))

// set CDN
app.use((req, res, next) => {
  req.cdn = (process.env.TURBO_ENV == 'dev') ? '' : process.env.TURBO_CDN
  next()
})

app.use((req, res, next) => {
  // if (req.session == null)
  //   return next()
  //
  // if (req.session.user == null)
  //   return next()
  //
  // controllers.profile.getById(req.session.user)

  if (req.vertex_session == null)
    return next()

  if (req.vertex_session.user == null)
    return next()

  controllers.profile.getById(req.vertex_session.user)
  .then(user => {
    req.user = user
    return next()
  })
  .catch(err => { // should probably clear session here:
    return next()
  })
})

// import routes
const index = require('./routes/index')
const api = require('./routes/api')
const account = require('./routes/account')
const admin = require('./routes/admin')
const rest = require('./routes/rest')

// set routes
app.use('/', index)
app.use('/api', api) // sample API Routes
app.use('/account', account)
app.use('/admin', admin)
app.use('/rest', rest)


module.exports = app
