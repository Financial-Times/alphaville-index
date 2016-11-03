'use strict';

const articleService = require('../services/article');
const articleSeriesUrl = require('../../views/helpers/articleSeriesUrl');
const imageHelper = require('../../views/helpers/image');

const itemsPerPage = 30;

module.exports = (req, res, next) => {
	articleService.getHotArticles(itemsPerPage)
	.then(articleService.categorization)
	.then(function(results) {
		results.hits.hits.forEach((article, index) => {
			if (index === 4) {
				article.adAfter = 1;
			}

			if (index === 10) {
				article.adAfter = 2;
			}
		});

		if (process.env.ENVIRONMENT === 'prod') {
			res.set('Cache-Control', 'public, max-age=30');
		}

		res.render('search', {
			title: `Most popular | FT Alphaville`,
			searchTerm: 'Most popular',
			searchResults: results.hits.hits,
			helpers: {
				articleSeriesUrl,
				image: imageHelper
			}
		});
	}).catch(next);
};