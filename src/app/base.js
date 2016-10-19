import $ from 'jquery';
import jqueryCycle from 'jquery-cycle';
import chunck from 'lodash.chunk';
import request from 'superagent';
import jsonp from 'superagent-jsonp';
import GoogleAnalytics from './google-analytics';

export default (() => {
    $(function() {
        drawer();
        styleTwitterStream();
    });

    const styleTwitterStream = () => {
        setTimeout(() => {
            const $frame = $('iframe#twitter-widget-0');
            const timelineClass = '.timeline-Widget';
            const headerClass = '.timeline-Header';
            const bodyClass = '.timeline-Body';
            const footerClass = '.timeline-Footer';
            const $timeline = $frame.contents().find(timelineClass);

            const $header = $timeline.find(headerClass);
            $header.css({ display: 'none' });

            const $body = $timeline.find(bodyClass);
            $body.css({ border: 'none', width: '329px' });

            const $footer = $timeline.find(footerClass);
            $footer.css({ display: 'none' });
        }, 500);
    }
    
    const drawer = () => {
        const $drawer = $('.drawer');
    
        $('.close').on('click', () => {
            $drawer.removeClass('show');
        });
    
        $('.open').on('click', () => {
            $drawer.addClass('show');
        });
    };
    
    request
        .get('https://api.github.com/users/walkerrandolphsmith/repos')
        .use(jsonp)
        .end((err, response) => {
            if (err || !response.body) return;
            let repos = [];
            if(response.body.data.message) {
                repos = [
                    {
                        name: 'yolo',
                        description: 'Andorid application',
                        url: 'http://github.com/walkerrandophsmith/yolo'
                    },
                    {
                        name: 'hush',
                        description: 'Andorid application',
                        url: 'http://github.com/walkerrandophsmith/hush'
                    },
                    {
                        name: 'VersionOne.Planr',
                        description: 'Andorid application',
                        url: 'http://github.com/walkerrandophsmith/VersionOne.Planr'
                    }
                ]
            } else {
                repos = response.body.data.map(repo =>({
                    name: repo.name,
                    description: repo.description,
                    url: repo.clone_url
                }));
            }
            cycle(repos, 'gh');
        });
    
    request
        .get('https://api.bitbucket.org/1.0/users/walkerrandolphsmith')
        .use(jsonp)
        .end((err, response) => {
            if (err || !response.body) return;
            const repos = response.body.repositories.map(repo =>({
                name: repo.name,
                description: repo.description,
                url: 'http://bitbucket.org/walkerrandolphsmith/' + repo.name.replace(/\s+/g, '-').toLowerCase()
            }));
            cycle(repos, 'bb');
        });
    
    request
        .get('http://jsfiddle.net/api/user/walkerrsmith/demo/list.json')
        .use(jsonp)
        .end((err, response) => {
            if (err || !response.body) return;
            const fiddles = response.body.list.map(fiddle =>({
                name: fiddle.title,
                description: fiddle.description,
                url: fiddle.url + fiddle.latest_version
            }));
            cycle(fiddles, 'jsf');
        });
    
    const cycle = (repos, key) => {
        const listItems = repos.map(
            repo => `<li><h5 class="name"><a href="${repo.url}" target="_blank">${repo.name}</a></h5><p class="description">${repo.description}</p></li>`
        );
    
        const groupSize = 2;
        const groups = chunck(listItems, groupSize);
    
        const $section = $(`#${key}-groups`);
    
        groups.forEach((group, i) => {
            const className = i === 0 ? ' active' : '';
            const $container = $(`<ul class="${key}-repos${className}"></ul>`);
            group.forEach(item => {
                $container.append($(item));
            });
            $section.append($container);
        });
    
        $section.cycle({
            fx:     'fade',
            prev:   `#${key}-prev`,
            next:   `#${key}-next`,
            timeout: 0,
            rev: true,
            delay: 100
        });
    };
})()