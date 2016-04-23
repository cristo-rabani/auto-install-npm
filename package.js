Package.describe({
    name: 'cristo:auto-install-npm',
    version: '0.0.5',
    summary: 'Check and try auto install required npm packages at the app level',
    git: 'https://github.com/tmeasday/auto-install-npm.git',
    documentation: 'README.md'
});

Npm.depends({
    'semver': '5.1.0'
});

Package.onUse(function (api) {
    api.versionsFrom('1.3');
    api.use('ecmascript');
    api.mainModule('auto-install-npm.js', ['server']);
    api.mainModule('auto-install-npm-stump.js', ['client']);
});
