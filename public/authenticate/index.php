<?php include_once __DIR__ . "/../config.php"; ?>
<!doctype html>
<html lang="en">
<head>
    <?php include "$rootPath/templates/php/head.php"; ?>
    <script src="<?= $rootURL ?>/js/auto-grow-textarea.js" defer></script>
    <script src="<?= $rootURL ?>/js/authenticate.js" type="module"></script>
    <title>Authenticate</title>
</head>
<body>
<div class="main-wrapper">
    <main>
        <h1>Logga In</h1>
        <form class="form login-form">
            <label>Användarnamn:
                <textarea id="username"></textarea>
            </label>
            <label>Lösenord:
                <input id="password" type="password">
            </label>
            <p class="error"></p>
            <input id="login-button" type="submit" value="Logga In">
        </form>
    </main>
</div>
</body>
</html>