const aws = require('aws-sdk')
const cloudfront = require('cloudfront')
const VERTEX_BUCKET = 'turbo360-vertex'
const DEFAULT_ZONE = 'us-east-1'

const lambdaClient = function(){
	const lambda = new aws.Lambda({
		region: DEFAULT_ZONE,
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
	})

	return lambda
}

const s3Client = function(){
	// aws.config.update({
	// 	region: DEFAULT_ZONE,
	// 	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	// 	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
	// })

	const s3 = new aws.S3({
		region: DEFAULT_ZONE,
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
	})

	return s3
}


module.exports = {

	createBucket: function(bucketName){
		return new Promise(function(resolve, reject){
			// const s3 = new aws.S3()
			const s3 = s3Client()
			const params = {
				Bucket: bucketName, /* required */
				ACL: 'public-read-write', // private | public-read | public-read-write | authenticated-read,
				// CreateBucketConfiguration: { // leaving this out creates bucket in US-EAST-1 (WTF!)
				//   LocationConstraint: 'us-west-1' // EU | eu-west-1 | us-west-1 | us-west-2 | ap-south-1 | ap-southeast-1 | ap-southeast-2 | ap-northeast-1 | sa-east-1 | cn-north-1 | eu-central-1
				// },
				// GrantFullControl: 'STRING_VALUE',
				// GrantRead: 'STRING_VALUE',
				// GrantReadACP: 'STRING_VALUE',
				// GrantWrite: 'STRING_VALUE',
				// GrantWriteACP: 'STRING_VALUE'
			}

			s3.createBucket(params, function(err, data) {
				if (err){
					reject(err)
					return
				}

				resolve(data)
			})
		})
	},

	updateBucket: function(bucketConfig){
		return new Promise(function(resolve, reject){
			// const s3 = new aws.S3()
			const s3 = s3Client()
			s3.putBucketWebsite(bucketConfig, function(err, data) {
				if (err) {
					reject(err)
					return
				}

				// update the displayed policy for the selected bucket
				resolve(data)
			})
		})
	},


	listObjects: function(folder){
		return new Promise(function(resolve, reject){
			const params = {
				Bucket: 'turbo360-vertex',
				Prefix: folder
			}

			// const s3 = new aws.S3()
			const s3 = s3Client()
			s3.listObjects(params, function(err, data) {
				if (err) {
					reject(err)
					return
				}

				resolve(data)
			})
		})
	},

	// copyObject: function(object, newObject, destinationBucket){
	copyObject: function(pkg){
		const object = pkg.object
		if (object == null){
			reject(new Error('Original object not specificed'))
			return
		}

		const newObject = pkg.newObject
		if (newObject == null){
			reject(new Error('New object not specificed'))
			return
		}

		const destinationBucket = pkg.destinationBucket
		if (destinationBucket == null){
			reject(new Error('Destination bucket not specificed'))
			return
		}

		return new Promise(function(resolve, reject){
			const params = {
				Bucket: destinationBucket, // destination bucket
				ACL: 'public-read',
				CopySource: object, // '/turbo360-vertex/text-board-tjpt0b/DOCUMENTATION.md',
				Key: newObject // name of the new file
			}

			// const s3 = new aws.S3()
			const s3 = s3Client()
			s3.copyObject(params, function(err, data) {
				if (err) {
					reject(err)
					return
				}
				resolve(data)
			})
		})
	},

	deleteObject: function(params){
		return new Promise(function(resolve, reject){
			// const s3 = new aws.S3()
			const s3 = s3Client()
			s3.listObjects({Bucket:params.Bucket, Prefix:params.Key+'/'}, function(err, data) {
				if (err) {
					reject(err)
					return
				}

				if (data.Contents.length == 0) {
					resolve(null)
					return
				}

				const deleteConfig = {
					Bucket:params.Bucket,
					Delete: {Objects:[]}
				}

				// params['Delete'] = {Objects:[]}
				data.Contents.forEach(function(content) {
					deleteConfig.Delete.Objects.push({Key: content.Key})
				})

				s3.deleteObjects(deleteConfig, function(err, data) {
					if (err){
						reject(err)
						return
					}

					resolve(data)
				})
			})
		})
	},

	createFolder: function(folderName){
		return new Promise(function(resolve, reject){
			const params = {
				Bucket: process.env.S3_BUCKET,
				Key: folderName+'/',
				ACL: 'public-read',
				Body: folderName
			}

			const s3 = s3Client()
			s3.upload(params, function(err, data) {
				if (err) {
					reject(err)
					return
				}

				resolve(data)
			})
		})
	},

	// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#copyObject-property
	// copyFolder: function(pkg){
	// 	return new Promise(function(resolve, reject){

	// 		// the original project being copied
	// 		if (pkg.source == null){
	// 			reject(new Error('Missing source parameter'))
	// 			return
	// 		}

	// 		// where to copy the project to
	// 		if (pkg.app == null){
	// 			reject(new Error('Missing app parameter'))
	// 			return
	// 		}

	// 		const params = {
	// 			Bucket: 'turbo360-vertex', // destination bucket
	// 			ACL: 'public-read',
	// 			CopySource: '/turbo360-vertex/' + pkg.source + '/package.zip',
	// 			Key: pkg.app + '/package.zip'
	// 		}

	// 		const s3 = new aws.S3()
	// 		s3.copyObject(params, function(err, data) {
	// 			if (err) {
	// 				reject(err)
	// 				return
	// 			}

	// 			const s = new s3Unzip({
	// 				bucket: 'turbo360-vertex/' + pkg.app,
	// 				file: 'package.zip',
	// 				deleteOnSuccess: false,
	// 				verbose: false
	// 			}, function(err, success){
	// 				if (err){
	// 					reject(err)
	// 					return
	// 				}

	// 				// this never returned on testing - it hangs forever but the unzip worked
	// 			})

	// 			resolve(data)
	// 		})
	// 	})
	// },

	// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#copyObject-property
	copyFolder: function(pkg){
		return new Promise(function(resolve, reject){

			// the original project being copied
			if (pkg.source == null){
				reject(new Error('Missing source parameter'))
				return
			}

			// where to copy the project to
			if (pkg.app == null){
				reject(new Error('Missing app parameter'))
				return
			}

			// const vertexBucket = 'turbo360-vertex'
			// const s3 = new aws.S3()
			const s3 = s3Client()

			// have to list all objects individually because there are no folders in S3
			s3.listObjects({Bucket:VERTEX_BUCKET, Prefix:pkg.source, MaxKeys:50000}, function(err, data) {
				if (err) {
					reject(err)
					return
				}

				if (data.Contents){
					data.Contents.forEach(function(object, i){
						const params = {
							Bucket: VERTEX_BUCKET, // destination bucket
							ACL: 'public-read',
							CopySource: '/turbo360-vertex/' + object.Key, // "Key": "text-board-tjpt0b/DOCUMENTATION.md",
							Key: pkg.app + object.Key.replace(pkg.source, '')
						}

						s3.copyObject(params, function(err, data) {
							// if (err) {
							// 	reject(err)
							// 	return
							// }
							// resolve(data)
						})
					})

					setTimeout(function(){
						resolve(data)
					}, 5000)

					return
				}

				resolve(data)
			})
		})
	},

	addCnameToCloudfront: function(cname){
		return new Promise(function(resolve, reject){
			// const cname = req.body.cname // this has to come from post params
			if (cname == null){
				reject(new Error('cname parameter required.'))
				return
			}

			const cf = cloudfront.createClient(process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY)

			const distributionId = process.env.CLOUDFRONT_PROD_ID // prod distrubution
			cf.getDistributionConfig(distributionId, function(err, config) {
				if (err) {
					reject(err)
				  	return
				}

				// console.log('ALIASES: '+JSON.stringify(config.aliases))
				// CONFIG: {"distribution":"E8Z7PJXCYYVMW","callerReference":"1495011317751","aliases":["*.turbo360-prod-1.com","www.yogastudiosnyc.com","www.socialpromotion.co"],"comment":"","enabled":true,"defaultRootObject":"","origins":[{"id":"S3-Website-turbo360-prod-1.s3-website-us-east-1.amazonaws.com","domainName":"turbo360-prod-1.s3-website-us-east-1.amazonaws.com","type":"custom","httpPort":"80","httpsPort":"443","protocolPolicy":"http-only"}],"logging":{"enabled":false,"bucket":"","prefix":""},"defaultCacheBehavior":{"targetOriginId":"S3-Website-turbo360-prod-1.s3-website-us-east-1.amazonaws.com","forwardQueryString":false,"trustedSigners":[],"viewerProtocolPolicy":"allow-all","minTTL":"0"},"cacheBehaviors":[],"etag":"E1ZWLCQK0CY7LM"}
				if (config.aliases.indexOf(cname) == -1)
					config.aliases.push(cname)

			    cf.setDistributionConfig(distributionId, config, function(err, config2) {
					if (err) {
						reject(err)
						return
					}

					resolve(config2)
			    })
			})
		})
	},

	getFunction: function(pkg){
		// console.log('GET FUNCTION: ' + JSON.stringify(pkg))
		return new Promise(function(resolve, reject){
			// const lambda = lambdaClient(pkg.config)
			const lambda = lambdaClient()
			const params = {
				FunctionName: pkg.name
			}

			lambda.getFunction(params, function(err, data) {
				if (err){
					resolve(null) // return null if not found
					// reject(err)
					return
				}

				resolve(data)
			})
		})
	},

	deleteFunction: function(pkg){
		// console.log('DELETE FUNCTION: ' + JSON.stringify(pkg))
		return new Promise(function(resolve, reject){
			const lambda = lambdaClient()
			const params = {
				FunctionName: pkg.name
			}

			lambda.deleteFunction(params, function(err, data) {
				if (err){
					reject(err)
					return
				}

				resolve(data)
			})
		})
	},

	// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#constructor-property
	deployVertex: function(pkg){
		return new Promise(function(resolve, reject){
			const runtimes = {
				node: 'nodejs6.10',
				python: 'python3.6',
				python3: 'python3.6',
				python2: 'python2.7'
			}

			// const lambda = lambdaClient(pkg.config)
			const lambda = lambdaClient()
			const runtime = 'nodejs6.10' // only support node for now
			const handler = 'www/bin.main'

			const envVariables = pkg.env || {} // environment variables
			const params = {
				Code: {
					S3Bucket: 'turbo360-vertex',
					S3Key: pkg.path
				},
				Environment: {Variables: envVariables},
				FunctionName: pkg.name,
				Role: 'arn:aws:iam::979120195943:role/aws-nodejs-dev-us-east-1-lambdaRole', // required
				Runtime: runtime,
				Handler: handler,
				Description: 'This is a Turbo 360 Vertex',
				MemorySize: 1024,
				Publish: true,
				Timeout: 60
			}

			lambda.createFunction(params, function(err, data) {
				if (err){
					reject(err)
					return
				}

				resolve(data)
			})
		})
	},

	// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#updateFunctionConfiguration-property
	updateVertex: function(pkg){
		return new Promise(function(resolve, reject){
			const lambda = lambdaClient()
			lambda.updateFunctionConfiguration(pkg, function(err, data) {
				if (err) {
					// console.log('ERROR: ' + err)
					reject(err)
					return
				}

				// console.log('RESOLVE: ' + JSON.stringify(data))
				resolve(data)
			})
		})
	},

	uploadUrl: function(params, bucket){
		return new Promise(function(resolve, reject){
			const folder = params.folder
			if (folder == null){
				reject(new Error('Missing folder.'))
				return
			}

			const filename = params.filename
			if (filename == null){
				reject(new Error('Missing filename.'))
				return
			}

			const filetype = params.filetype
			if (filetype == null){
				reject(new Error('Missing filetype.'))
				return
			}

			aws.config.update({
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
			})

			const s3 = new aws.S3()
			const s3Params = {
				Bucket: bucket + '/' + params.folder, // change this to app slug
				Key: filename,
				Expires: 3600,
				ContentType: filetype,
				ACL: 'public-read'
			}

			s3.getSignedUrl('putObject', s3Params, function(err, data) {
			    if (err){
				    console.log('S3 ERROR: '+err)
			    	reject(err)
				    return
			    }

			    resolve({
				    upload: data,
				    url: 'https://' + bucket + '.s3.amazonaws.com/' + filename
			    })
			})
		})
	},

	invalidateCache: function(distributionId, folder, file){
		return new Promise(function(resolve, reject){
			aws.config.update({
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
			})

			const params = {
				DistributionId: distributionId,
				InvalidationBatch: {
					CallerReference: Date.now().toString(),
					Paths: {
						Quantity: 1,
						// Items: ['/'+folder+'/*'] // invalidate folder to clear edge cache
						Items: ['/'+folder+'/'+file] // invalidate folder to clear edge cache
					}
				}
			}

			const cloudfront = new aws.CloudFront()
			cloudfront.createInvalidation(params, function(err, data) {
				if (err){ // resolve no matter what
					resolve()
					return
				}

				resolve(data)
			})
		})
	}
}
