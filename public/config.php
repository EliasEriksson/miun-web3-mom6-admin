<?php
error_reporting(-1);
ini_set("display_errors", 1);
/**
 * rootURL is is a reference to the siteRoot no matter where the project is placed on the system
 * if config.php is placed so that its accessed on the webserver with domain.com/level1/level2/level3/config.php
 * rootURl will be an absolute URL referring to /level1/level2/level3/
 *
 * this is helpful when structure is different on localhost vs live host. if links are prefixed with this
 * the files will always be found.
 */
$rootURL = str_replace(str_replace(__DIR__, "", $_SERVER["SCRIPT_FILENAME"]), "", $_SERVER["PHP_SELF"]);

/**
 * rootPath is a reference to the sites root on the file system
 *
 * this is helpful when referring to other php files on the filesystem.
 */
$rootPath = __DIR__;
