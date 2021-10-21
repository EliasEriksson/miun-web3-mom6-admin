<?php
include_once __DIR__ . "/config.php";
include_once __DIR__ . "/src/xrender.php";
?>

<!doctype html>
<html lang="sv">
<head>
    <?php include "$rootPath/templates/php/head.php"; ?>
    <script src="js/auto-grow-textarea.js" defer></script>
    <script src="js/admin.js" type="module"></script>
    <title>Admin</title>
</head>
<body>
<div class="main-wrapper">
    <main>
        <h1>Admin</h1>
        <section id="kurser">
            <div class="top-navigator">
                <a href="#kurser">
                    <svg id="{{ id }}" class="svg-button expand-button rotate-270deg" viewBox="0 0 40 40">
                        <rect class="background" x="0" y="0" width="40" height="40"></rect>
                        <polygon class="foreground" points="30,20 15,35 10,30 20,20, 10,10 15,5"></polygon>
                    </svg>
                </a>
            </div>
            <div class="section-controls">
                <div>
                    <?= render("$rootPath/templates/html/toggle.html", [
                        "id" => "course-expand-button"
                    ]) ?>
                    <h2>Kurser</h2>
                </div>
                <div>
                    <img id="course-loading" class="loading disabled" src="<?= $rootURL ?>/media/loading.gif"
                         alt="loading">
                    <?= render("$rootPath/templates/html/apply.html", [
                        "id" => "apply-courses"
                    ]); ?>
                    <?= render("$rootPath/templates/html/plus.html", [
                        "id" => "add-course"
                    ]) ?>
                </div>
            </div>
            <div id="course-list"></div>
        </section>
        <section id="jobb">
            <div class="top-navigator">
                <a href="#jobb">
                    <svg id="{{ id }}" class="svg-button expand-button rotate-270deg" viewBox="0 0 40 40">
                        <rect class="background" x="0" y="0" width="40" height="40"></rect>
                        <polygon class="foreground" points="30,20 15,35 10,30 20,20, 10,10 15,5"></polygon>
                    </svg>
                </a>
            </div>
            <div class="section-controls">
                <div>
                    <?= render("$rootPath/templates/html/toggle.html", [
                        "id" => "job-expand-button"
                    ]) ?>
                    <h2>Jobb</h2>
                </div>
                <div>
                    <img id="job-loading" class="loading disabled" src="<?= $rootURL ?>/media/loading.gif"
                         alt="loading">
                    <?= render("$rootPath/templates/html/apply.html", [
                        "id" => "apply-jobs"
                    ]); ?>
                    <?= render("$rootPath/templates/html/plus.html", [
                        "id" => "add-job"
                    ]) ?>
                </div>
            </div>
            <div id="job-list"></div>
        </section>
        <section id="webpages">
            <div class="top-navigator">
                <a href="#webpages">
                    <svg id="{{ id }}" class="svg-button expand-button rotate-270deg" viewBox="0 0 40 40">
                        <rect class="background" x="0" y="0" width="40" height="40"></rect>
                        <polygon class="foreground" points="30,20 15,35 10,30 20,20, 10,10 15,5"></polygon>
                    </svg>
                </a>
            </div>
            <div class="section-controls">
                <div>
                    <?= render("$rootPath/templates/html/toggle.html", [
                        "id" => "webpage-expand-button"
                    ]) ?>
                    <h2>Webbplatser</h2>
                </div>
                <div>
                    <img id="website-loading" class="loading disabled" src="<?= $rootURL ?>/media/loading.gif"
                         alt="loading">
                    <?= render("$rootPath/templates/html/apply.html", [
                        "id" => "apply-webpages"
                    ]); ?>
                    <?= render("$rootPath/templates/html/plus.html", [
                        "id" => "add-webpage"
                    ]) ?>
                </div>
            </div>
            <div id="webpage-list"></div>
        </section>
    </main>
</div>
<?php include "$rootPath/templates/php/footer.php"; ?>
</body>
</html>