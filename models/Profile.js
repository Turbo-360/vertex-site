const mongoose = require('mongoose')

const truncateText = (str, limit) => {
	if (str.length < limit)
		return str

	return str.substring(0, limit)+'...'
}

const ProfileSchema = new mongoose.Schema({
	firstName: {type:String, trim:true, lowercase:true, default:''},
	lastName: {type:String, trim:true, lowercase:true, default:''},
	slug: {type:String, trim:true, lowercase:true, default:''},
	authsource: {type:String, trim:true, lowercase:true, default:'standard'}, // standard or google
	referrer: {type:String, default:''},
	featured: {type:String, default:'no'},
	confirmed: {type:String, default:'no'},
	email: {type:String, trim:true, lowercase:true, default:''},
	accountType: {type:String, trim:true, lowercase:true, default:'basic'}, // basic, premium
	stripeId: {type:String, trim:true, default:''},
	creditCard: {type:mongoose.Schema.Types.Mixed, default:{}},
	githubId: {type:String, trim:true, default:''},
	tags: {type:Array, default:[]},
	notifications: {type:Array, default:[]}, // 10 most recent notifications
	followers: {type:Array, default:[]},
	following: {type:Array, default:[]},
	password: {type:String, default:''},
	bio: {type:String, default:''},
	username: {type:String, trim:true, default:''},
	following: {type:Array, default:[]}, // Users can follow other users or projects. Array of IDs
	velocityId: {type:String, default:''},
	image: {type:String, trim:true, default:process.env.DEFAULT_ICON}, // default profile icon
	api: {type:mongoose.Schema.Types.Mixed, default:{key:'', secret:''}}, // api key and secret
	ip: {type:mongoose.Schema.Types.Mixed, default:{}}, // http://ip-api.com/json/173.166.182.94
	location: {type:mongoose.Schema.Types.Mixed, default:{city:'', state:'', country:''}},
	lastLogin: {type:Date, default:null},
	token: {type:String, default:''},
	timestamp: {type:Date, default:Date.now},
	activityIndex: {type: Number, default: 0}, // an index which reflects how 'active' user is
	promoCode: {type:String, trim:true, lowercase:true, default:''}
	// monthlyRate: {type: Number, default: 0},
	// isAdmin: {type:String, trim:true, lowercase:true, default:'no'},
	// resume: {type:String, trim:true, default:''},
	// credits: {type: Number, default: 20},
})

ProfileSchema.methods.addNotification = function(notification){
	notification['isRead'] = false
	const notifications = Object.assign([], this.notifications)
	notifications.unshift(notification)
	this.notifications = notifications
	this.markModified('notifications')
}

ProfileSchema.methods.summary = function(key) {
	const summary = {
		firstName: this.firstName,
		lastName: this.lastName,
		slug: this.slug,
		authsource: this.authsource,
		referrer: this.referrer,
		featured: this.featured,
		confirmed: this.confirmed,
		githubId: this.githubId,
		accountType: this.accountType,
		email: this.email,
		tags: this.tags,
		notifications: this.notifications,
		followers: this.followers,
		following: this.following,
		bio: this.bio,
		username: this.username,
		following: this.following,
		image: this.image,
		activityIndex: this.activityIndex,
		promoCode: this.promoCode,
		// api: this.api,
		// ip: this.ip,
		location: this.location,
		lastLogin: this.lastLogin,
		token: this.token,
		meta: () => { // meta data for <head> tag
			return {
				title: this.firstName+' '+this.lastName,
				url: 'https://www.vertex360.co/profile/' + this.slug,
				image: this.image+'=s260-c',
				description: truncateText(this.bio, 220)
			}
		},
		timestamp: this.timestamp,
		schema: 'profile',
		id: this._id.toString()
	}

	if (key === process.env.ADMIN_API_KEY){
		summary['ip'] = this.ip
		summary['api'] = this.api
		summary['creditCard'] = this.creditCard
		summary['stripeId'] = this.stripeId
	}

	return summary
}

ProfileSchema.statics.convertToJson = function(profiles, key){ // key can be null
	var results = new Array()
	for (var i=0; i<profiles.length; i++){
		var p = profiles[i]
		results.push(p.summary(key))
	}

	return results
}


module.exports = mongoose.model('ProfileSchema', ProfileSchema)
