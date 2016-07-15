'use strict';

const articleService = require('../services/article');

const getArticles = articleService.getArticles;
const categorization = articleService.categorization;

module.exports = (req, res, next) => {
	getArticles()
		.then(categorization)
		.then((response) => {
			
			if (process.env.ENVIRONMENT === 'prod') {
				res.set('Cache-Control', 'public, max-age=30');
			}

			const heroIndex = response.hits.hits.findIndex(function(item) {
				return item._source.standout.hero;
			});
			const hero = response.hits.hits.splice(heroIndex, 1);

			res.render('index', {
				headerConfig: {
					toggleArticleView: {
						url: '/home',
						grid: true
					}
				},
				title: 'FT Alphaville | FT Alphaville &#8211; Market Commentary &#8211; FT.com',
				searchResults: response.hits.hits,
				hero: hero
			});

		}).catch(next);
};