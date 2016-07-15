'use strict';

const elasticSearch = require('alphaville-es-interface');
const _ = require('lodash');

/*
 Bryce Elder
 Kadhim Shubber
 Izabella Kaminska
 David Keohane
 Cardiff Garcia
 Matt Klein
 Joseph Cotterill
 Dan McCrum
 Paul Murphy
 */


function getHeadshot(authorName) {
	const headshots = [{
		name: 'David Keohane',
		url: 'http://ftalphaville.ft.com/files/2012/08/115_davidKeohane.png'
	}, {
		name: 'Cardiff Garcia',
		url: 'http://ftalphaville.ft.com/files/2012/09/115_cardiffGarcia.png'
	}, {
		name: 'Izabella Kaminska',
		url: 'http://ftalphaville.ft.com/files/2012/10/115_izabellaKaminska.png'
	}];
	const authorHeadshot = headshots.filter(function(item) {
		return (item.name === authorName);
	});
	return (authorHeadshot.length > 0) ? authorHeadshot[0] : false;
}

function ellipsisTrim(str, length) {
	const options = {
		length,
		separator: ' '
	};
	return _.truncate(str, options);
}

function categorization(response) {
	let isHeroSelected = false;
	let isAuthorLeadSelected = false;
	let isAuthorLeadWithImageSelected = false;
	let isTopicLeadSelected = false;

	response.hits.hits.forEach(function(obj, index) {


		function filterMetadataBy(options) {
			// return filterBy(obj._source.metadata, options);
			return _.filter(obj._source.metadata, options);
		}

		delete obj._source.bodyXML;
		delete obj._source.openingXML;

		obj._source.standout = {
			hero: false,
			authorLead: false,
			topicLead: false,
			authorLeadWithImage: false,
			image: false
		};

		if (index === 12) {
			obj.adAfter_small = true;
		}

		if (index === 13) {
			obj.adAfter_large = true;
		}

		if (obj.isMarketsLive === true) {
			obj._webUrl = '/content/' + obj._id;
			obj._source.primaryTheme = 'Markets Live';
			obj._source.title = obj._source.title.replace(/Markets Live: /, '');
			obj._source.cardType = 'marketslive';
		} else {
			obj._webUrl = '/content/' + obj._id;
			obj._source.primaryTheme = false;
			obj._source.cardType = 'blogs';

			if (filterMetadataBy({ prefLabel: 'First FT' }).length > 0) {
				obj.isBriefing = true;
				obj._source.primaryTheme = 'BRIEFING: First FT';
				obj._source.cardType = 'firstFt';
				obj._source.title = ellipsisTrim(obj._source.title, 240);
				// obj._source.summaries = ['Apple executive eyes media business', 'At Goldman, you’re more than a number', 'Universal basic income: money for nothing']

			} else if (filterMetadataBy({ prefLabel: 'Podcasts' }).length > 0) {
				obj.isPodcast = true;
				obj._source.primaryTheme = 'Podcast: Alphachat';
				obj._source.cardType = 'podcast';
				obj._source.title = ellipsisTrim(obj._source.title, 60);
				// obj._source.mainImage.url = getImageServiceUrl(obj._source.mainImage.url);
				obj._source.summaries = [ellipsisTrim(obj._source.summaries[0], 200)];

			} else if (obj._source.title.indexOf('FT Opening Quote') > -1) {
				obj._source.primaryTheme = 'FT Opening Quote';
				obj.isBlog = true;

			} else if (obj._source.title.indexOf('Further reading') > -1) {
				obj._source.primaryTheme = 'Further reading';
				obj.isBlog = true;

			} else {

				const authors = filterMetadataBy({ taxonomy: 'authors' });
				const author = (authors.length > 0) ? authors[0] : false;
				const authorHeadshot = (author) ? getHeadshot(author.prefLabel) : false;

				if (obj._source.mainImage && !isHeroSelected && obj._source.title.indexOf('Alphachat:') === -1 && obj._source.title.indexOf('Thought for the weekend') === -1) {
					// if (obj._id === '23247ac0-0b0b-3c7b-9f4d-03b0e0b48a09'){
					obj._source.standout.hero = true;
					obj._source.primaryTheme = 'Markets';

					if (!obj._source.mainImage) {
						obj._source.cardType = 'hero';
					} else {
						obj._source.cardType = 'heroWithImage';
					}



					isHeroSelected = true;

				} else if (!isAuthorLeadSelected && (authors.length > 0) && authorHeadshot && obj._source.title.indexOf('Alphachat:') === -1 && obj._source.title.indexOf('Thought for the weekend') === -1) {
					obj.isAuthorLead = true;
					obj._source.standout.authorLead = true;
					obj._source.cardType = 'authorLead';

					const author = authors[0];
					obj._source.primaryTheme = author.prefLabel;
					obj._source.headshot = authorHeadshot.url;

					isAuthorLeadSelected = true;

				} else if (obj._source.mainImage && !isAuthorLeadWithImageSelected && authors.length > 0 && obj._source.title.indexOf('Alphachat:') === -1 && obj._source.title.indexOf('Thought for the weekend') === -1) {
					obj.isAuthorLeadWithImage = true;
					obj._source.standout.authorLeadWithImage = true;
					obj._source.cardType = 'authorLeadWithImage';

					const author = authors[0];
					obj._source.primaryTheme = author.prefLabel;

					isAuthorLeadWithImageSelected = true;

				} else if (!isTopicLeadSelected && obj._source.title.indexOf('Alphachat:') === -1 && obj._source.title.indexOf('Thought for the weekend') === -1) {
					obj.isTopicLead = true;
					obj._source.standout.topicLead = true;
					obj._source.cardType = 'topicLead';
					obj._source.primaryTheme = "Topic: Markets";


					isTopicLeadSelected = true;

				} else {

					console.log('primaryTheme');
					obj._source.primaryTheme = filterMetadataBy({ primary: 'section', taxonomy: 'sections' })[0].prefLabel;
					obj.isBlog = true;

				}

			}

			if (obj._source.title.length > 120) {
				obj._source.title = ellipsisTrim(obj._source.title, 120);
			}

		}
	});
	return response;
}

function getArticles() {
	return elasticSearch.searchArticles({
		'method': 'POST',
		'body': JSON.stringify({
			'filter': {
				or: {
					filters: [{
						term: {
							"metadata.primary": {
								value: "brand"
							},
							"metadata.idV1": {
								value: "ZDkyYTVhMzYtYjAyOS00OWI1LWI5ZTgtM2QyYTIzYjk4Y2Jj-QnJhbmRz" // FT Alphaville
							}
						}
					}, {
						term: {
							"metadata.primary": {
								value: "brand"
							},
							"metadata.idV1": {
								value: "N2NkMjJiYzQtOGI3MC00NTM4LTgzYmYtMTQ3YmJkZGZkODJj-QnJhbmRz" // First FT
							}
						}
					}]
				}
			},
			'sort': {
				publishedDate: {
					order: 'desc'
				}
			},
			'size': 35
		})

	});
}

module.exports = {
	categorization,
	getArticles
};