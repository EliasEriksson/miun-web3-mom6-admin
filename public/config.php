<?php
error_reporting(-1);
ini_set("display_errors", 1);
$rootURL = str_replace(str_replace(__DIR__, "", $_SERVER["SCRIPT_FILENAME"]), "", $_SERVER["PHP_SELF"]);
$rootPath = __DIR__;
