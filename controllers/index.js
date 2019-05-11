const SiteController = require('./SiteController')
const ProfileController = require('./ProfileController')
const BlobController = require('./BlobController')
const PostController = require('./PostController')
const CommentController = require('./CommentController')

module.exports = {

	site: SiteController,
	profile: ProfileController,
	blob: BlobController,
	post: PostController,
	comment: CommentController

}
