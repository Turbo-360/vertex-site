const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
	author: {type:mongoose.Schema.Types.Mixed, default:{}},
	title: {type:String, trim:true, default: ''},
	isPublic: {type:String, trim:true, default:'no'}, // posts are not visible until this is set to 'yes'
	tags: {type:Array, default:[]},
	preview: {type:String, trim:true, default: ''},
	text: {type:String, trim:true, default: ''},
	image: {type:String, trim:true, default: ''}, // green logo
	slug: {type:String, lowercase:true, trim:true, default:''},
	link: {type:String, trim:true, default:''}, // for links to outside posts
	type: {type:String, lowercase:true, default:'original'}, // original or link
	numReplies: {type:Number, default:0},
	votes: {type:mongoose.Schema.Types.Mixed, default:{up:[], down:[], score:0}},
	thread: {type:String, default:'' },
	dateString: {type:String, default:'' },
	timestamp: {type:Date, default:Date.now}
})

PostSchema.methods.summary = function(authLevel) {
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
		schema: 'post',
		id: this._id.toString()
	}

	return summary
}


PostSchema.statics.convertToJson = function(posts, key){ // key can be null
	var results = new Array()
	for (var i=0; i<posts.length; i++){
		var p = posts[i]
		results.push(p.summary(key))
	}

	return results
}

module.exports = mongoose.model('Post', PostSchema)
