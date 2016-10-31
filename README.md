# Metalsmith Tags

[Metalsmith](http://metalsmith.io/) can be used to generate a blog. This plugin generates populate metadata about
which blog posts are grouped together by tag.

## Options

### handle
Name of the key used in yaml to indicate the list of tags a post is related to

### sortBy
Key used to sort files related to a post by.

### reverse
Reverse the order of the sort

### template
Template used to render a static page for list of files related to a tag

### filter
Function that filters out files so they are not processed by the plugin

### listName
Key used to store a list of tags and their counts

### getMetadata
Function whose arguments are a file and a tag, allowing adding more context around a file that is related to a tag.


## Usage
```
var tags = require('metalsmith-tags');

metalsmith
  .use(tags({
    handle: 'tags',
    sortBy: 'date',
    reverse: true,
    template: 'tags.hbt',
    filter: file => file.path.indexOf('file-i-care-about') >= 0,
    listName: 'tag-cloud',
    getMetadata: (file, tag) => ({ icon: tag title: tag })
  }));
```