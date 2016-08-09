# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.0.0] - 2016-08-09
### Changed
- `isMasterTab` event now passes an argument specifying wether the
  current tab is the master (`true`) or not (`false`).

### Fixed
- Fixed a bug that could cause two or more tabs to behave as masters
  when the browser loaded them at the same time.