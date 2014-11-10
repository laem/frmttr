LIBRARY_FILES = \
    node_modules/d3/src/start.js \
    node_modules/d3/src/format/format.js \
    node_modules/d3/src/end.js



lib.js: $(LIBRARY_FILES)
	node_modules/.bin/smash $(LIBRARY_FILES) > d3.format.js
