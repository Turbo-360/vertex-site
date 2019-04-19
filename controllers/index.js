const SiteController = require('./SiteController')
const ProfileController = require('./ProfileController')
const BlobController = require('./BlobController')
const PostController = require('./PostController')

module.exports = {

	site: SiteController,
	profile: ProfileController,
	blob: BlobController,
	post: PostController

}
