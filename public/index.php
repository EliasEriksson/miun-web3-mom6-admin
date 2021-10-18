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
<?php include "$rootPath/templates/php/header.php" ?>
<div class="main-wrapper">
    <main>
        <h1>Admin</h1>
        <section>
            <div class="section-controls">
                <div>
                    <?= render("$rootPath/templates/html/toggle.html", [
                        "id" => "course-expand-button"
                    ]) ?>
                    <h2>Kurser</h2>
                </div>
                <div>
                    <img id="course-loading" class="loading disabled" src="<?=$rootURL?>/media/loading.gif" alt="loading">
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
        <section>
            <div class="section-controls">
                <div>
                    <?= render("$rootPath/templates/html/toggle.html", [
                            "id" => "job-expand-button"
                    ])?>
                    <h2>Jobs</h2>
                </div>
                <div>
                    <img id="job-loading" class="loading disabled" src="<?=$rootURL?>/media/loading.gif" alt="loading">
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
        <section>
            <div class="section-controls">
                <div>
                    <img id="website-loading" class="loading disabled" src="<?=$rootURL?>/media/loading.gif" alt="loading">
                    <?= render("$rootPath/templates/html/toggle.html", [
                        "id" => "webpage-expand-button"
                    ])?>
                    <h2>Webbplatser</h2>
                </div>
                <div>
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