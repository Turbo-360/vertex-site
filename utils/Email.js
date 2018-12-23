var helper = require('sendgrid').mail
var Mailgun = require('mailgun-js')
var superagent = require('superagent')
var Base64 = require('js-base64').Base64


module.exports = {
	isValidEmail: function(email){
		var isFakeEmail = false
		var fakeDomains = ['mvrht.net', 'fleckens.hu', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com', 'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'nwytg.com', 'sharklasers.com', 'test.com', 'ruu.kr', 'copyhome.win', 'cozaco.men', 'happyhs.party', 'iralborz.bid', 'japorms.trade', 'jiwanpani.science', 'joyandkin.cricket', 'kadaj.date', 'kcstore.faith', 'kopame.review', 'koreakr.review', 'kukov.download', 'kumli.racing', 'mimimin.webcam', 'named.accountant']

		for (var i=0; i<fakeDomains.length; i++){
			var domain = fakeDomains[i]
			if (email.indexOf(domain) != -1){ // this is a bullshit email
				isFakeEmail = true
				break
			}
		}

		if (isFakeEmail == true)
			return false


		return true
	},

	sendEmail: function(from, fromname, recipient, subject, text){
		// return new Promise(function (resolve, reject){

			// this is broken
		// 	var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD)
		// 	sendgrid.send({
		// 		to:       recipient,
		// 		from:     from,
		// 		fromname: fromname,
		// 		subject:  subject,
		// 		text:     text
		// 	}, function(err) {
		// 		if (err) {
		// 			console.log('EMAIL MANAGER ERROR: '+err)
		// 			reject(err);
		// 		}
		// 		else { resolve(); }
		// 	})
		// })
	},

	sendEmails: function(from, fromname, recipients, subject, text){
		return new Promise(function(resolve, reject){

			var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD)
			for (var i=0; i<recipients.length; i++){
				var recipient = recipients[i]
				if (recipient.indexOf('@') == -1) // invalid
					continue

				sendgrid.send({
					to:       recipient,
					from:     from,
					fromname: fromname,
					subject:  subject,
					html:     text
					//text:     text
				}, function(err) {
					// if (err) {reject(err); }
					// else { resolve(); }
				})
			}

			resolve()
		})
	},

	sendHtmlEmails: function(from, fromname, recipients, subject, html){
		return new Promise(function(resolve, reject){
			var sg = require('sendgrid')(process.env.SENDGRID_API_KEY)
			var from_email = new helper.Email(from, fromname)
			// var content = new helper.Content('text/html', html)

			recipients.forEach(function(recipient, i) {
				var to_email = new helper.Email(recipient)
				var formattedHtml = html.replace('<% unsubscribe %>', recipient)
				var content = new helper.Content('text/html', formattedHtml)

				var mail = new helper.Mail(from_email, subject, to_email, content)

				var request = sg.emptyRequest({
					method: 'POST',
					path: '/v3/mail/send',
					body: mail.toJSON()
				})

				sg.API(request, function(error, response) {
					// if (error){
					// 	reject(error)
					// }
					// else {
					// 	resolve(response)
					// }
				})
			})

			resolve()
		})
	},

	sendToMailingList: function(pkg){
		return new Promise(function(resolve, reject){
			if (pkg.list == null){
				reject(new Error('Missing list'))
				return
			}

			if (pkg.from == null){
				reject(new Error('Missing from'))
				return
			}

			if (pkg.fromname == null){
				reject(new Error('Missing fromname'))
				return
			}

			if (pkg.subject == null){
				reject(new Error('Missing subject'))
				return
			}

			if (pkg.content == null){
				reject(new Error('Missing content'))
				return
			}

			// const data = {
			// 	to: 'dailypicks@mail.thevarsity.co',
			// 	from: 'Devin Kennedy <dev.kennedy36@gmail.com>',
			// 	sender: 'Devin Kennedy', // from name
			// 	subject: req.body.subject,
			// 	html: req.body.content
			// }

			const data = {
				to: pkg.list,
				from: pkg.fromname+' <'+pkg.from+'>',
				sender: pkg.fromname, // from name
				subject: pkg.subject,
				html: pkg.content
			}

			const mailgun = Mailgun({
				apiKey: process.env.MAILGUN_API_KEY,
				domain: process.env.MAILGUN_DEFAULT_DOMAIN
			})

			mailgun.messages().send(data, (error, body) => {
				if (error){
					reject(error)
					return
				}

				resolve(body)
				return
			})
		})
	},

	// addToMailingList: function(email, list){
	addToMailingList: function(pkg){
		// https://documentation.mailgun.com/en/latest/api-mailinglists.html#mailing-lists
		// POST /lists/<address>/members
		return new Promise(function(resolve, reject){
			var email = pkg.email
			if (email == null){
				reject('Missing Email Address')
				return
			}

			var list = pkg.list
			if (list == null){
				reject('Missing Mailing List')
				return
			}

			// var params = 'smtp_password='+smtp_password+'&name='+domain
			var params = 'address='+email+'&upsert=yes'
			if (pkg.name != null){
				params += '&name='+pkg.name
			}

			superagent
			.post('https://api.mailgun.net/v3/lists/'+list+'/members')
			.send(params)
			.set('Authorization', 'Basic '+Base64.encode('api:'+process.env.MAILGUN_API_KEY))
			.set('Accept', 'application/json')
			.end(function(err, response){
		        if (err) {
		            console.log('Mailgun Error: ', err)
		            reject(err)
		            return
		        }

		        // TODO: check confirmation key from response
		        const json = JSON.parse(response.text)

		        // console.log('MAILGUN RESPONSE: ' + JSON.stringify(json))
		        // {"domain":{"created_at":"Sat, 08 Jul 2017 05:02:23 GMT","name":"turbomail.dailyslate.co","require_tls":false,"skip_verification":false,"smtp_login":"postmaster@turbomail.dailyslate.co","smtp_password":"595992eacb6ddf0011e4c195","spam_action":"disabled","state":"unverified","type":"custom","web_prefix":"email","web_scheme":"http","wildcard":false},"message":"Domain has been created","receiving_dns_records":[{"cached":[],"priority":"10","record_type":"MX","valid":"unknown","value":"mxa.mailgun.org"},{"cached":[],"priority":"10","record_type":"MX","valid":"unknown","value":"mxb.mailgun.org"}],"sending_dns_records":[{"cached":[],"name":"turbomail.dailyslate.co","record_type":"TXT","valid":"unknown","value":"v=spf1 include:mailgun.org ~all"},{"cached":[],"name":"pic._domainkey.turbomail.dailyslate.co","record_type":"TXT","valid":"unknown","value":"k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCpLhpZtwWtEoZkp3jw9HNf1wR8RiyFZm0bCixg449FF8Y+z+MzZKjhtIOqEee72+K0vD3Hs3GYulq0trw9qbN85ot4vt7KZBQ5maWAAg/CSSPEHiJvgW00KEeNWgdjukjE/+6VSJirNhnG1SV8/4RcFR646FCk+YhBjWLLBLIlzwIDAQAB"},{"cached":[],"name":"email.turbomail.dailyslate.co","record_type":"CNAME","valid":"unknown","value":"mailgun.org"}]}
		        resolve(json)
			})

		})
	},

	// https://documentation.mailgun.com/api-domains.html#example
	// this adds another domain to the overall Mailgun account. Individual domains can send
	// emails as if they are sub accounts. This basically whitelabelse MG:
	addDomain: function(domain, smtp_password){
		return new Promise(function(resolve, reject){
			if (domain == null){
				reject(new Error('Missing domain parameter.'))
				return
			}

			if (smtp_password == null){
				reject(new Error('Missing smtp_password parameter.'))
				return
			}

			// domain should be something like mailgun.velocity360.io
			var params = 'smtp_password='+smtp_password+'&name='+domain

			superagent
			.post('https://api.mailgun.net/v3/domains')
			.send(params)
			.set('Authorization', 'Basic '+Base64.encode('api:'+process.env.MAILGUN_API_KEY))
			.set('Accept', 'application/json')
			.end(function(err, response){
		        if (err) {
		            console.log('Mailgun Error: ', err)
		            reject(err)
		            return
		        }


		        // TODO: check confirmation key from response
		        const json = JSON.parse(response.text)

		        // console.log('MAILGUN RESPONSE: ' + JSON.stringify(json))
		        // {"domain":{"created_at":"Sat, 08 Jul 2017 05:02:23 GMT","name":"turbomail.dailyslate.co","require_tls":false,"skip_verification":false,"smtp_login":"postmaster@turbomail.dailyslate.co","smtp_password":"595992eacb6ddf0011e4c195","spam_action":"disabled","state":"unverified","type":"custom","web_prefix":"email","web_scheme":"http","wildcard":false},"message":"Domain has been created","receiving_dns_records":[{"cached":[],"priority":"10","record_type":"MX","valid":"unknown","value":"mxa.mailgun.org"},{"cached":[],"priority":"10","record_type":"MX","valid":"unknown","value":"mxb.mailgun.org"}],"sending_dns_records":[{"cached":[],"name":"turbomail.dailyslate.co","record_type":"TXT","valid":"unknown","value":"v=spf1 include:mailgun.org ~all"},{"cached":[],"name":"pic._domainkey.turbomail.dailyslate.co","record_type":"TXT","valid":"unknown","value":"k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCpLhpZtwWtEoZkp3jw9HNf1wR8RiyFZm0bCixg449FF8Y+z+MzZKjhtIOqEee72+K0vD3Hs3GYulq0trw9qbN85ot4vt7KZBQ5maWAAg/CSSPEHiJvgW00KEeNWgdjukjE/+6VSJirNhnG1SV8/4RcFR646FCk+YhBjWLLBLIlzwIDAQAB"},{"cached":[],"name":"email.turbomail.dailyslate.co","record_type":"CNAME","valid":"unknown","value":"mailgun.org"}]}
		        resolve(json)
			})
		})
	}


	/* Returned from Mailgun:
		{
			"confirmation": "success",
			"response": {
				"domain": {
					"created_at": "Wed, 24 May 2017 23:28:17 GMT",
					"name": "turbomail.yogastudiosnyc.com",
					"require_tls": false,
					"skip_verification": false,
					"smtp_login": "postmaster@turbomail.yogastudiosnyc.com",
					"smtp_password": "abcdefg",
					"spam_action": "disabled",
					"state": "unverified",
					"type": "custom",
					"web_prefix": "email",
					"wildcard": false
				},
				"message": "Domain has been created",
				"receiving_dns_records": [
					{
						"cached": [],
						"priority": "10",
						"record_type": "MX",
						"valid": "unknown",
						"value": "mxa.mailgun.org"
					},
					{
						"cached": [],
						"priority": "10",
						"record_type": "MX",
						"valid": "unknown",
						"value": "mxb.mailgun.org"
					}
				],
				"sending_dns_records": [
					{
						"cached": [],
						"name": "turbomail.yogastudiosnyc.com",
						"record_type": "TXT",
						"valid": "unknown",
						"value": "v=spf1 include:mailgun.org ~all"
					},
					{
						"cached": [],
						"name": "k1._domainkey.turbomail.yogastudiosnyc.com",
						"record_type": "TXT",
						"valid": "unknown",
						"value": "k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDqwGmGF3zvT5RJNCluvJwB6SXFRbkf9NdTTge+bHa3MP+sNiIuZWXCYMDPsPFU0/e5mlw9/0ELhJ3jENDnK+AwC5DnFUY8cPnJK3P0blxw5CNI+j3JSWPonGnIrTt2E75C92ip5niny1Pa0EADmwGLpt86HfQS4+o+EQha9G2j2wIDAQAB"
					},
					{
						"cached": [],
						"name": "email.turbomail.yogastudiosnyc.com",
						"record_type": "CNAME",
						"valid": "unknown",
						"value": "mailgun.org"
					}
				]
			}
		}
	*/


}
