-include .env

DATABASE_URL=$(MONGODB_URI); \

.env:
	heroku config -s  >> .env --app av2-blogs-test

bower_components:
	bower install

node_modules:
	npm install

install-tools:
	npm install -g bower; \
	npm install -g gulp

install: .env bower_components node_modules

clean:
	rm -rf .env bower_components node_modules

run-dev: install
	export SKIP_AUTH=true; \
	heroku local