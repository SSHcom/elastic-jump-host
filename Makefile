.PHONY: all

all: | node_modules
	@npm run build
	@npm run lint

# No tests yet!
#	@npm run test

node_modules:
	@npm install
