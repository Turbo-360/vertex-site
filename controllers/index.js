const SiteController = require('./SiteController')
const ProfileController = require('./ProfileController')
const BlobController = require('./BlobController')
const PostController = require('./PostController')
const CommentController = require('./CommentController')
const EventController = require('./EventController')
const TicketController = require('./TicketController')
const ThreadController = require('./ThreadController')
const SubscriberController = require('./SubscriberController')

module.exports = {

	site: SiteController,
	profile: ProfileController,
	blob: BlobController,
	post: PostController,
	comment: CommentController,
	event: EventController,
	ticket: TicketController,
	thread: ThreadController,
	subscriber: SubscriberController

}
