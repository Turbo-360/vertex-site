var mongoose = require('mongoose')

var App = new mongoose.Schema({
	name: {type:String, trim:true, lowercase:true, default:''},
  profile: {type:mongoose.Schema.Types.Mixed, default:{}},
  image: {type:String, trim:true, default:''},
  description: {type:String, trim:true, default:''},
	preview: {type:String, trim:true, default: ''},
	tags: {type:Array, default:[]},
	users: {type:Array, default:[]}, // list of sites using the app
	slug: {type:String, lowercase:true, trim:true, default:''},
	link: {type:String, trim:true, default:''}, // link to 3rd party landing page, if any
	votes: {type:mongoose.Schema.Types.Mixed, default:{up:[], down:[], score:0}},
	timestamp: {type:Date, default:Date.now}
})

App.methods.summary = function() {
	return {
		name: this.name,
    profile: this.profile,
    image: this.image,
    description: this.description,
		preview: this.preview,
		tags: this.tags,
		slug: this.slug,
		link: this.link,
		votes: this.votes,
		timestamp: this.timestamp,
		schema: 'app',
		id: this._id.toString()
	}
}

module.exports = mongoose.model('App', App)
