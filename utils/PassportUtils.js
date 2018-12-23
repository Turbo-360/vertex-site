var LocalStrategy = require('passport-local').Strategy
var InstagramStrategy = require('passport-instagram').Strategy
var OAuth2Strategy = require('passport-oauth2').Strategy
var FacebookStrategy = require('passport-facebook').Strategy
var bcrypt = require('bcryptjs')

function isValidPassword(pass, hashPass){
    return bcrypt.compareSync(pass, hashPass)
}

function generateHash(pass){
    return bcrypt.hashSync(pass, 8)
}

module.exports = {
    configureGenericStrategy: function(passport, config){
        passport.use(new OAuth2Strategy({
            authorizationURL: 'https://api.instagram.com/oauth/authorize/',
            tokenURL: 'https://api.instagram.com/oauth/access_token',
            clientID: config.client_id,
            clientSecret: config.client_secret,
            callbackURL: config.redirect_uri
        }, function(accessToken, refreshToken, profile, cb) {
            console.log('TEST: '+accessToken+': '+JSON.stringify(profile))
            return cb(null, accessToken)
            // User.findOrCreate({ exampleId: profile.id }, function (err, user) {
            //   return cb(err, user);
            // });
            }
        ))
    },

    configureInstagramStrategy: function(passport, config){
        passport.use(new InstagramStrategy({
            clientID        : config.client_id,
            clientSecret    : config.client_secret,
            callbackURL     : config.redirect_uri,
            passReqToCallback : true
        }, function(req, accessToken, refreshToken, profile, done) {
            // console.log('REQ: '+req.url)
            // console.log('PROFILE: '+profile)
            // console.log('TOKEN: '+accessToken)

            var payload = {
                user: profile._json.data,
                accessToken: accessToken,
                refreshToken: refreshToken || null
            }

            return done(null, payload)
        }))
    },


    configureFacebookStrategy: function(passport, config){
        passport.use(new FacebookStrategy({
            clientID : config.client_id,
            clientSecret : config.client_secret,
            callbackURL : config.redirect_uri,
            profileFields : ['id', 'birthday', 'email', 'first_name', 'gender', 'last_name'],
            passReqToCallback : true 
        }, function(req, accessToken, refreshToken, profile, done) {
            // PROFILE:{"id":"1791958047785038","name":{"familyName":"Kennedy","givenName":"Devin"},
            // "gender":"male","provider":"facebook",
            // "_raw":"{\"id\":\"1791958047785038\",\"first_name\":\"Devin\",\"gender\":\"male\",\"last_name\":\"Kennedy\"}","_json":{"id":"1791958047785038","first_name":"Devin","gender":"male","last_name":"Kennedy"}}

            var payload = {
                user: JSON.parse(profile._raw),
                accessToken: accessToken,
                refreshToken: refreshToken || null
            }

            // console.log('PAYLOAD:'+JSON.stringify(payload))
            return done(null, payload)
        }))
    }
}

/*
module.exports = function(passport, config) {
    // passport.serializeUser(function(user, done) {
    //     done(null, user.id)
    // })

    // passport.serializeUser(function(user, done) {
    //     done(null, user)
    // })


    // passport.deserializeUser(function(obj, done) {
    //     done(null, obj)

    //     // Profile.findById(id, function(err, user) {
    //     //     done(err, user)
    //     // })
    // })


    //Local login
    // passport.use('local-login', new LocalStrategy({
    //     usernameField : 'email',
    //     passwordField : 'password',
    //     passReqToCallback : true 
    // }, function(req, email, password, done) {
    //     Profile.findOne({'local.email':email}, function(err, user) {
    //         if (err)
    //             return done(err)

    //         if (!user)
    //             return done(null, false, {message: 'User not found'})

    //         if (!isValidPassword(password, user.local.password))
    //             return done(null, false, {message: 'Invalid password'})

    //         else
    //             return done(null, user)
    //     })
    // }))

    //Local signup
    // passport.use('local-signup', new LocalStrategy({
    //     usernameField : 'email',
    //     passwordField : 'password',
    //     passReqToCallback : true 
    // }, function(req, email, password, done) {
    //     Profile.findOne({'local.email': email}, function(err, existingUser) {
    //         if (err)
    //             return done(err)
    //         if (existingUser) 
    //             return done(null, false, {message: 'A profile with that email already exists'})
    //         // Logged in, connect local account
    //         if(req.user) {
    //             var user = req.user
    //             user.local.email = email
    //             user.local.password = generateHash(password)
    //             user.save(function(err) {
    //                 if (err)
    //                     throw err;
    //                 return done(null, user)
    //             });
    //         } 
    //         // Create new Profile
    //         else {
    //             var newUser = new Profile();
    //             newUser.local.email = email
    //             newUser.local.password = generateHash(password)
    //             newUser.save(function(err) {
    //                 if (err)
    //                     throw err;
    //                 return done(null, newUser)
    //             });
    //         }
    //     });
    // }));

    //Brand signup
    // passport.use('brand-signup', new LocalStrategy({
    //     usernameField : 'email',
    //     passwordField : 'password',
    //     passReqToCallback : true 
    // }, function(req, email, password, done) {
    //     Profile.findOne({'local.email': email}, function(err, existingUser) {
    //         if (err)
    //             return done(err)
    //         if (existingUser) 
    //             return done(null, false, {message: 'A profile with that email already exists'})
    //         // Logged in, connect local account
    //         if(req.user) {
    //             var user = req.user
    //             user.local.email = email
    //             user.local.password = generateHash(password)
    //             user.save(function(err) {
    //                 if (err)
    //                     throw err;
    //                 return done(null, user)
    //             });
    //         } 
    //         // Create new Profile
    //         else {
    //             var newUser = new Profile();
    //             newUser.local.email = email
    //             newUser.local.password = generateHash(password)
    //             newUser.local.isBrand = 'true'
    //             newUser.save(function(err) {
    //                 if (err)
    //                     throw err;
    //                 return done(null, newUser)
    //             });
    //         }
    //     });
    // }));

}
*/