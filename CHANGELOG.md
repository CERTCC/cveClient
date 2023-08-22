# cveClient Changelog

Version 1.0.18  2023-08-21

* Fixed some bugs on cveInterface.js related to apply_diff
* Added the ability to download CVE JSON from repositories for edit/duplicate
* Moved display capabilities using CSS.


Version 1.0.18  2023-08-09

* Fixed some bugs on cveInterface.js related to from_json and to_json routines
* The cveclientLib on 1.0.14 now support ADP capability
* The User Management interface bug fixes on duplicate ID or duplicate name field fixed.
* ADP client interface is available only via JSON editor at this time.
* Require at least One product to have STatus  "affected" or "unknown".

Version 1.0.17  2023-08-09
* Allow entry of CVE data without being logged in just to create mock records
* Implemented offload download button for CVE records
* Fixed XSS issue due to changes to CVE Services RSUS interface
* Pagination issues resolved
