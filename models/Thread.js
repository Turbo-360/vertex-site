const mongoose = require('mongoose')

const ThreadSchema = new mongoose.Schema({
	subject: {type:mongoose.Schema.Types.Mixed, default:{}}, // post, site, profile, etc
	profile: {type:mongoose.Schema.Types.Mixed, default:{}},
	site: {type:mongoose.Schema.Types.Mixed, default:{}},
	slug: {type:String, lowercase:true, trim:true, default:''},
	numReplies: {type:Number, default:0},
	votes: {type:mongoose.Schema.Types.Mixed, default:{up:[], down:[], score:0}},
	dateString: {type:String, default:''},
	timestamp: {type:Date, default:Date.now}
})

ThreadSchema.methods.summary = function(authLevel) {
	var summary = {
		subject: this.subject,
		profile: this.profile,
		site: this.site,
		slug: this.slug,
		numReplies: this.numReplies,
		votes: this.votes,
		dateString: this.dateString,
		timestamp: this.timestamp,
		schema: 'thread',
		id: this._id.toString()
	}

	return summary
}


ThreadSchema.statics.convertToJson = function(threads, key){ // key can be null
	var results = new Array()
	for (var i=0; i<threads.length; i++){
		var p = threads[i]
		results.push(p.summary(key))
	}

	return results
}

module.exports = mongoose.model('Thread', ThreadSchema)
