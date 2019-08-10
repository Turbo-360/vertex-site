var mongoose = require('mongoose')

var App = new mongoose.Schema({
	name: {type:String, trim:true, default:''},
  profile: {type:mongoose.Schema.Types.Mixed, default:{}},
  image: {type:String, trim:true, default:''},
  description: {type:String, trim:true, default:''},
	timestamp: {type:Date, default:Date.now}
})

App.methods.summary = function() {
	return {
		name: this.name,
    profile: this.profile,
    image: this.image,
    description: this.description,
		timestamp: this.timestamp,
		schema: 'app',
		id: this._id.toString()
	}
}

module.exports = mongoose.model('App', App)
