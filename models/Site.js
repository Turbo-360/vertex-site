const mongoose = require('mongoose')

const truncateText = (str, limit) => {
	if (str.length < limit)
		return str

	return str.substring(0, limit)+'...'
}

const SiteSchema = new mongoose.Schema({
	profile: {type:mongoose.Schema.Types.Mixed, default:{}},
	level: {type:String, trim:true, default: 'basic'},
	origin: {type:String, trim:true, default: 'vertex360'}, // vertex360, turbo360
	format: {type:String, trim:true, default: 'vertex'}, // static, vertex, react
	clonePrice: {type:Number, default:0},
	numSubscribers: {type:Number, default:0},
	collaborators: {type:Array, default:[]},
	tags: {type:Array, default:[]},
	invited: {type:Array, default:[]},
	isClone: {type:String, trim:true, default: 'no'},
	cloneSource: {type:String, trim:true, default: ''}, // SLUG of original clone source
	canClone: {type:String, trim:true, default: 'no'},
	featured: {type:String, trim:true, default: 'no'},
	published: {type:String, trim:true, default: 'no'},
	github: {type:String, trim:true, default: ''}, // github repo
	name: {type:String, trim:true, default: ''},
	description: {type:String, trim:true, default: ''},
	category: {type:String, trim:true, default:'lifestyle', lowercase:true},
	image: {type:String, trim:true, default: process.env.IMAGE_PLACEHOLDER},
	images: {type:Array, default:[]},
	slug: {type:String, trim:true, default: ''}, // this is also the S3 bucket identifier
	url: {type:String, trim:true, default: ''},
	resources: {type:Array, default: ['user', 'post', 'comment']}, // list resources
	oauth: {type:mongoose.Schema.Types.Mixed, default:{}}, // group of oauth credentials: instagram, facebook, etc
	smtp: {type:mongoose.Schema.Types.Mixed, default:{}}, // DNS records for mailgun verification
	stripe: {type:mongoose.Schema.Types.Mixed, default:{}}, // stripe API credentials
	functions: {type:mongoose.Schema.Types.Mixed, default:{}}, // vectors
	template: {type:mongoose.Schema.Types.Mixed, default:{category:'misc', status:'dev', tutorial:'', video:''}}, // template info for vertex360.co. status="published" means template is live for use in vertex360
	globalConfig: {type:mongoose.Schema.Types.Mixed, default:{key:'value'}}, // global configuration for pages
	pages: {type:Array, default:['home']}, // array of static pages
	api: {type:mongoose.Schema.Types.Mixed, default:{key:'', secret:''}}, // api key and secret
	paypal: {type:mongoose.Schema.Types.Mixed, default:{clientId:'', clientSecret:''}},
	authorized: {type:Array, default:[]}, // array of authorized api keys
	votes: {type:mongoose.Schema.Types.Mixed, default:{up:[], down:[], score:0}},
	services: {type:Array, default: ['datastore', 'blog', 'storage']}, // the defaults are free. after that, updgrade required.
	timestamp: {type:Date, default:Date.now}
})

SiteSchema.methods.summary = function(authLevel) {
	let paypal = this.paypal
	if (authLevel!='admin'){
		paypal = {
			clientId: this.paypal.clientId
		}
	}

	const summary = {
		profile: this.profile,
		format: this.format,
		origin: this.origin,
		clonePrice: this.clonePrice,
		numSubscribers: this.numSubscribers,
		collaborators: this.collaborators,
		tags: this.tags,
		invited: this.invited,
		isClone: this.isClone,
		cloneSource: this.cloneSource,
		canClone: this.canClone,
		featured: this.featured,
		published: this.published,
		slug: this.slug,
		name: this.name,
		level: this.level,
		description: this.description,
		category: this.category,
		image: (this.image.length == 0) ? process.env.IMAGE_PLACEHOLDER : this.image,
		images: this.images,
		url: this.url,
		votes: {up:this.votes.up.length, down:this.votes.down.length, score:this.votes.score},
		api: this.api,
		paypal: paypal,
		globalConfig: this.globalConfig,
		// pages: this.pages,
		template: this.template,
		timestamp: this.timestamp,
		schema: 'site',
		id: this._id.toString()
	}

	return summary
}

SiteSchema.statics.convertToJson = function(sites, key){ // key can be null
	const results = new Array()
	for (var i=0; i<sites.length; i++){
		var p = sites[i]
		results.push(p.summary(key))
	}

	return results
}


module.exports = mongoose.model('SiteSchema', SiteSchema)
