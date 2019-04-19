const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
	user: {type:mongoose.Schema.Types.Mixed, default:{}},
	// site: {type:String, trim:true, default: ''}, // id number of site
	title: {type:String, trim:true, default: ''},
	tags: {type:Array, default:[]},
	preview: {type:String, trim:true, default: ''},
	text: {type:String, trim:true, default: ''},
	image: {type:String, trim:true, default: ''}, // green logo
	slug: {type:String, lowercase:true, trim:true, default:''},
	link: {type:String, trim:true, default:''},
	type: {type:String, lowercase:true, default:'original'}, // original or link
	numReplies: {type:Number, default:0},
	isPublic: {type:String, trim:true, default:'yes'},
	thread: {type:String, default:'' },
	dateString: {type:String, default:'' },
	props: {type:mongoose.Schema.Types.Mixed, default:{}},
	timestamp: {type:Date, default:Date.now}
})

PostSchema.methods.summary = function(authLevel) {
	var summary = {
		title: this.title,
		// site:this.site,
		tags: this.tags,
		image: this.image,
		user: this.user,
		preview: this.preview,
		text: this.text,
		slug: this.slug,
		isPublic: this.isPublic,
		numReplies: this.numReplies,
		link: this.link,
		type: this.type,
		thread: this.thread,
		dateString: this.dateString,
		timestamp: this.timestamp,
		schema: 'post',
		id: this._id.toString()
	}

	return summary
}


module.exports = mongoose.model('Post', PostSchema)
