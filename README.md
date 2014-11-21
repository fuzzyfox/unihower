# Eisenhower
[![Build Status](https://travis-ci.org/not-so-creative/eisenhower.svg?branch=master)](https://travis-ci.org/not-so-creative/eisenhower)
[![Dependency Status](https://david-dm.org/not-so-creative/eisenhower.svg)](https://david-dm.org/not-so-creative/eisenhower)
[![devDependency Status](https://david-dm.org/not-so-creative/eisenhower/dev-status.svg)](https://david-dm.org/not-so-creative/eisenhower#info=devDependencies)

A tool for the prioritisation of tasks based on Eisenhower Desicion Matricies.

Created as a part of the [CO600 Module](https://www.kent.ac.uk/courses/modulecatalogue/modules/CO600) submission by [William Duyck](http://wduyck.me) and Eliot Brown, at the [University of Kent](https://www.kent.ac.uk/).

## Abstract
Eisenhower decision matrices split tasks by urgency and importance. This is a modified version of the original boxes and uses directed graphs.

## Development

### Getting Started
Make sure you have both **grunt** and **bower** installed.

	npm install -g grunt-cli bower

Once installed clone this repository and run:

	npm install && grunt

This will install all the required dependencies, and start the development server which should now be running on port `4321`.

### Play nice
Where possible use an [EditorConfig](http://editorconfig.org/) compatible editor/plugin.

* Remove trailing whitespace from files.
* Use ASCII filenames.
* Run `grunt test` before commit and check for errors.

**Do this all with ease!**

	mv .git/hooks/pre-commit.sample .git/hooks/pre-commit
	echo "\n# run grunt build before commit, abort if errors\ngrunt test" >> .git/hooks/pre-commit

## License
**Unless otherwise stated:**
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
