const cheerio = require('cheerio')
const superagent = require('superagent')

module.exports = {

//	scrape: (url, props) => {
	scrape: (pkg) => {
		return new Promise((resolve, reject) => {
			const url = pkg.url
			if (url == null){
				reject(new Error('Missing url parameter'))
				return
			}

			const props = pkg.props || ['title', 'description', 'image', 'url'] // default props

			superagent
			.get(url)
			.query(null)
			.set('Accept', 'text/html')
			.end((err, response) => {
				if (err){
					reject(err)
					return
				}

				const metaData = {}
				$ = cheerio.load(response.text)
				$('meta').each(function(i, meta) {
					if (meta.attribs == null) // continue
						return true

					const attribs = meta.attribs
					if (attribs.property == null) // continue
						return true

					const prop = attribs.property.replace('og:', '')
					if (props.indexOf(prop) == -1) // continue
						return true

          metaData[prop] = attribs.content
		    })

		    // console.log('META == '+JSON.stringify(metaData))
				resolve(metaData)
			})
		})
	}

}
