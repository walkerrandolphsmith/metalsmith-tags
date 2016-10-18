var gulp         = require('gulp');
var gulpsmith    = require( 'gulpsmith');
var filter       = require('gulp-filter');
frontMatter      = require('gulp-front-matter');
assign           = require('lodash.assign');

var collections  = require('metalsmith-collections');
var markdown     = require('metalsmith-markdown');
var katex        = require('metalsmith-katex');
var templates    = require('metalsmith-templates');
var permalinks   = require('metalsmith-permalinks');
var gist         = require('metalsmith-gist');
var drafts       = require('metalsmith-drafts');
var pagination   = require('metalsmith-pagination');
var wordcount    = require("metalsmith-word-count");
var ignore       = require('metalsmith-ignore');
var Handlebars   = require('handlebars');
var excerpts     = require('metalsmith-excerpts');
var sitemap      = require('metalsmith-mapsite');
var robots       = require('metalsmith-robots');
var feed         = require('metalsmith-feed');

var fs           = require('fs');
var moment       = require('moment');
var _            = require('underscore');

const PROTOCOL = 'http';
const HOST = 'localhost';
const PORT = 3000;
const URL = `${PROTOCOL}://${HOST}:${PORT}`;
var baseUrl = URL;

const templatePath = './src/templates';
const partialPath = `${templatePath}/partials`;

Handlebars.registerPartial({
    header: fs.readFileSync(`${partialPath}/header.hbt`).toString(),
    footer: fs.readFileSync(`${partialPath}/footer.hbt`).toString(),
    drawer: fs.readFileSync(`${partialPath}/drawer.hbt`).toString(),
    navigation: fs.readFileSync(`${partialPath}/navigation.hbt`).toString(),
    pagination: fs.readFileSync(`${partialPath}/pagination.hbt`).toString()
});

Handlebars.registerHelper('baseUrl', function() {
    return baseUrl;
});

Handlebars.registerHelper('dateFormat', function( context ) {
    return moment(context).format("LL");
});

Handlebars.registerHelper('dateGMT', function( context ) {
    context = context === 'new' ? new Date() : context;
    return context.toGMTString();
});

Handlebars.registerHelper('currentPage', function( current, page ) {
    return current === page ? 'current' : '';
});

Handlebars.registerHelper('firstTag', function( tags) {
    var running = '';
    for(var i = 0; i < tags.length; i++) {
        var char = tags[i];
        if(char === ',') {
            return running.trim();
        } else {
            running += char;
        }
    }
});

Handlebars.registerHelper('stripExcerpt', function( excerpt ) {
    return new Handlebars.SafeString(
        excerpt ? excerpt.replace('<p>', '').replace('</p>', '') : ''
    );
});

Handlebars.registerHelper('tagList', function(context) {
    const tags = context.posts
        .reduce((tags, post, i) => tags.concat(post.tags.concat([','])), [])
        .filter(tag => tag !== ' ')
        .join('')
        .split(',')
        .filter(tag => !!tag);

    var counts = {};

    for (var i = 0; i < tags.length; i++)
        counts[tags[i]] = (counts[tags[i]] + 1) || 1;

    return new Handlebars.SafeString(
        [...new Set(tags)]
            .map(tag => `<a href=${baseUrl}/tags/${tag}/>${tag} (${counts[tag]})</a>`)
            .join('')
    )
});

Handlebars.registerHelper('tagListWithoutCount', function(context) {
    const allTags = context.posts
        .reduce((tags, post, i) => tags.concat(post.tags.concat([','])), [])
        .filter(tag => tag !== ' ')
        .join('')
        .split(',')
        .filter(tag => !!tag)
        .map(tag => `<a class="tag" href=${baseUrl}/tags/${tag}/>${tag}</a>`);

    const tags = [...new Set(allTags)];

    return new Handlebars.SafeString(tags.join(''))
});

Handlebars.registerHelper('dropIndexHtml', function(url) {
    return url.replace('index.html', '');
});

var ignoreOpts = [
    '**/*.less',
    'app/**/*.*'
];

var collectionOpts = {
    posts: {
        pattern: 'posts/*.md',
        sortBy: 'date',
        reverse: true
    },
    pages: {
        pattern: 'pages/*.md'
    }
};

var feedOpts = {
    collection: 'posts'
};

var permalinkOpts = {
    pattern: ':title',
    relative: false
};

var paginationOpts = {
    'collections.posts': {
        perPage: 2,
        template: 'indexWithPagination.hbt',
        first: 'index.html',
        path: ':num/index.html'
    }
};

var tagOpts = {
    handle: 'tags',
    template:'tags.hbt',
    path:'tags',
    sortBy: 'title',
    reverse: true
};

var templatesOpts = {
    engine: 'handlebars',
    directory: templatePath
};

var fullName = 'walkerrandolphsmith';

var metaData = {
    site_url: 'http://www.walkerrandolphsmith.com',
    site_name: fullName,
    site: {
        title: 'Walker Randolph Smith',
        url: 'http://www.walkerrandolphsmith.com',
        author: fullName
    },
    author: {
        handle: fullName,
        email: 'walkerrandolphsmith@gmail.com',
        name: 'walker randolph smith',
        shortName: 'walker smith',
        shortDesc: 'I am an author of this short description in metadata',
        longDesc: ''
    },
    accounts: {
        twitter: {
            handle: 'WalkerRSmith',
            url: 'twitter.com/'
        },
        linkedin: {
            handle: fullName,
            url: 'linkedin.com/'
        },
        stackOverflow: {
            handle: fullName,
            url: 'stackoverflow.com/'
        }
    }
};

var sitemapOpts = {
    hostname: 'http://www.walkerrandolphsmith.com',
    omitIndex: true
};

var robotsOpts = {
    sitemap: 'http://www.walkerrandolphsmith.com/sitemap.xml'
};


tags = function(opts){
    var defaultOpts = { path:"tags/", yaml: { template: "tags.hbt" } };
    opts = _.defaults(opts || {}, defaultOpts);
    return function(files, metalsmith, done){
        meta = metalsmith.metadata();
        var tags = _.reduce(files, function(memo,file,path) {
            file.tags = file.tags ? _.map(file.tags,function(t){return t.toLowerCase();}) : [];

            var xx = [];
            var running = '';
            for(var i = 0; i < file.tags.length; i++) {
                var char = file.tags[i];
                if(char === ',') {
                    xx.push(running.trim());
                    running = '';
                } else {
                    running += char;
                }
            }
            xx.push(running.trim());

            _.each(xx,function(tag){
                key = opts.path + "/" + tag + "/index.html";
                memo[key] = _.defaults({}, memo[key], { tag:tag, posts:[], contents:'' }, opts.yaml);
                memo[key].posts = _.sortBy(memo[key].posts.concat(file), 'date').reverse();
            });
            return memo;
        }, {});

        _.extend(files, tags);

        meta.taglist = _.sortBy(_.reduce(tags, function(memo, tag) {
            return memo.concat({ tag: tag.tag, count: tag.posts.length, posts: tag.posts });
        },[]), 'count').reverse();

        meta.tags = _.reduce(tags, function(memo,tag) {
            memo[tag.tag] = { tag: tag.tag, count: tag.posts.length, posts: tag.posts };
            return memo;
        },{});

        done();
    };
};


gulp.task('metalsmith', function() {
    const markdownFilter = filter(file => /md/.test(file.path));

    return gulp
        .src('src/**')
        .pipe(markdownFilter)
        .pipe(frontMatter()).on('data', function(file) {
            assign(file, file.frontMatter);
            delete file.frontMatter;
        })
        //.pipe(markdownFilter.restore)
        .pipe(
            gulpsmith()
                .metadata(metaData)
                .use(ignore(ignoreOpts))
                .use(drafts())
                .use(wordcount())
                .use(collections(collectionOpts))
                .use(katex())
                .use(markdown())
                .use(excerpts())
                .use(permalinks(permalinkOpts))
                .use(pagination(paginationOpts))
                .use(gist())
                .use(tags(tagOpts))
                .use(sitemap(sitemapOpts))
                .use(robots(robotsOpts))
                .use(feed(feedOpts))
                .use(templates(templatesOpts))
        )
        .pipe(gulp.dest('./build'));
});