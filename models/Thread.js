const mongoose = require('mongoose')

const ThreadSchema = new mongoose.Schema({
	author: {type:mongoose.Schema.Types.Mixed, default:{}},
  post: {type:mongoose.Schema.Types.Mixed, default:{}},
	slug: {type:String, lowercase:true, trim:true, default:''},
	link: {type:String, trim:true, default:''}, // for links to outside posts
	numReplies: {type:Number, default:0},
	votes: {type:mongoose.Schema.Types.Mixed, default:{up:[], down:[], score:0}},
	dateString: {type:String, default:'' },
	timestamp: {type:Date, default:Date.now}
})

ThreadSchema.methods.summary = function(authLevel) {
	var summary = {
		title: this.title,
		tags: this.tags,
		image: this.image,
		author: this.author,
		preview: this.preview,
		text: this.text,
		slug: this.slug,
		isPublic: this.isPublic,
		numReplies: this.numReplies,
		link: this.link,
		type: this.type,
		votes: {up:this.votes.up.length, down:this.votes.down.length, score:this.votes.score},
		thread: this.thread,
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
