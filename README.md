# cristo:auto-install-npm

This package is inspired by  `tmeasday:check-npm-versions` and partly based on it.
The biggest difference againts check-npm-versions  is that this package will add missing dependencies to your application package.json.

After that, this package will call command: `meteor npm install`
(Mostly this is all, but somethimes you will must run `npm install`)

Take care that this package works only in develop mode (so you should launch in this mode meteor, once after adding new package)

Additional important things are permissions to package.js and of course this file should existed in project.

```js
import autoInstallNpm from 'meteor/cristo:auto-install-npm';

autoInstallNpm({
    'to-markdown': '1.3.0'
}, 'universe:react-markdown-wysiwyg');

const toMarkdown = require('to-markdown');
```

*This package is in working progress, but it seems to work*
