const assign = require('lodash.assign');

module.exports = (options) => {
    const defaultOptions = {
        handle: 'tags',
        sortBy: 'title',
        reverse: true,
        template: "tags.hbt",
        filter: file => file,
        listName: 'tagsList',
        getMetadata: (file, tag) => ({})
    };
    const opts = assign(defaultOptions, options);

    return (files, metalsmith, done) => {
        meta = metalsmith.metadata();

        const tags = Object
            .keys(files)
            .reduce((array, key) => array.concat(
                Object.assign({}, files[key], { key: key})
            ), [])
            .filter(options.filter)
            .filter(file => file[opts.handle])
            .reduce((memo, file) => {
                const tags = file[opts.handle];

                tags.forEach(tag => {
                    const key = `${opts.handle}/${tag}/index.html`;
                    const tagDefaults = { tag: tag, posts: [], contents: '', template: opts.template };
                    const tagMetadata = opts.getMetadata(file, tag);
                    
                    memo[key] = Object.assign({}, tagMetadata, tagDefaults, memo[key]);
                    memo[key].posts = memo[key].posts.concat([file]);
                    assign(files[file.key], { tags });
                });
                return memo;
            }, {});

        assign(files, tags);

        const tagsArray = Object
            .keys(tags)
            .reduce((array, key) => array.concat(
                Object.assign({}, { path: key }, tags[key])
            ), []);

        metalsmith.metadata()[options.listName] = tagsArray
            .reduce((memo, tag) => memo.concat(
                Object.assign({}, tag, { count: tag.posts.length })
            ), [])
            .sort((curr, next) => curr.count < next.count);

        metalsmith.metadata().tags = tagsArray;

        done();
    };
};