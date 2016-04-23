import path from 'path';
import fs from 'fs';
import semver from 'semver';
import {_} from 'meteor/underscore';
import {exec} from 'child_process';

const execSync = Meteor.wrapAsync((...params) => {
    const cb = params.pop();
    exec(...params, (error, stdout, stderr) => {
        stdout && console.log(stdout.toString());
        stderr && console.error(stderr.toString());
        cb(error);
    });
});
const projectRoot = (cwd => {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }
    const indexMeteor = cwd.indexOf('/.meteor/');
    if (indexMeteor === -1) {
        return;
    }
    const p = cwd.substring(0, indexMeteor);
    if (!p) {
        return;
    }
    return path.join(p, 'package.json');

})(process.cwd());

// Returns:
//   - true      if a version of the package in the range is installed
//   - false     if no version is installed
//   - version#  if incompatible version is installed
function compatibleVersionIsInstalled (name, range) {
    try {
        const installedVersion = require(`${name}/package.json`).version;
        if (semver.satisfies(installedVersion, range)) {
            return true;
        } else {
            return installedVersion;
        }
    } catch (e) {
        // XXX add something to the tool to make this more reliable
        const message = e.toString();
        // One message comes out of the install npm package the other from npm directly
        if (message.match('Cannot find module') || message.match('Can\'t find npm module')) {
            return false;
        } else {
            throw e;
        }
    }
}

export default function autoInstallNpm (packages, packageName) {
    const failures = {};
    _.forEach(packages, (range, name) => {
        const failure = compatibleVersionIsInstalled(name, range);
        if (failure !== true) {
            failures[name] = failure;
        }
    });

    if (_.keys(failures).length === 0) {
        return true;
    }

    const errors = [];
    const npmPackages = {};

    _.forEach(failures, (installed, name) => {
        const requirement = `${name}@${packages[name]}`;

        if (installed) {
            errors.push(` - ${name}@${installed} installed, ${requirement} needed`);
        } else {
            npmPackages[name] = packages[name];
        }
    });
    if (Object.keys(npmPackages).length) {
        if (!addDependencyToPackageJson(npmPackages)) {
            var arr = Object.keys(npmPackages);
            if (arr && arr.length > 1) {
                errors.push(` - some of ${arr.join()} are not installed or with problems.`);
            } else {
                errors.push(` - ${arr.join(', ')} is not installed correctly or at all.`);
            }

        }
    }

    if (errors && errors.length) {
        const qualifier = packageName ? `(for ${packageName}) ` : '';
        console.warn(`WARNING: npm peer requirements ${qualifier}not installed:\n${errors.join('\n')}`);
    }
}

function getPackageJson () {
    if (!projectRoot) {
        return;
    }
    let packageJson;
    try {
        packageJson = Npm.require(projectRoot);
    } catch (e) {
        console.warn(e.message);
    }
    return packageJson;
}

function addDependencyToPackageJson (deps) {
    if (!projectRoot || typeof deps !== 'object') {
        return;
    }
    const packageDef = getPackageJson();
    if (packageDef && packageDef.name) {
        if (!packageDef.dependencies) {
            packageDef.dependencies = {};
        }
        Object.keys(deps).forEach(name => packageDef.dependencies[name] = deps[name]);

        try {
            console.log('Refreshing dependencies in ' + projectRoot);
            fs.writeFileSync(projectRoot, JSON.stringify(packageDef, undefined, 4));
            console.log('New dependencies: ' +
                Object.keys(deps).map(k=> k + '@' + deps[k]).join(', '));
            console.log('running: meteor npm install');
            execSync('meteor npm install', {cwd: path.dirname(projectRoot)});
            return packageDef;
        } catch (e) {
            console.error(e);
        }
    }
}
