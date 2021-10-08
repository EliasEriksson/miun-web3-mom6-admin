<?php
include_once __DIR__ . "/config.php";
include_once __DIR__ . "/src/xrender.php";
?>

<!doctype html>
<html lang="sv">
<head>
    <?php include "$rootPath/templates/php/head.php"; ?>
    <script src="js/auto-grow-textarea.js" defer></script>
    <script src="js/admin-courses.js" defer></script>
    <title>Admin</title>
</head>
<body>
<?php include "$rootPath/templates/php/header.php" ?>
<div class="main-wrapper">
    <main>
        <h1>Admin</h1>
        <section class="course-section">
            <div class="section-heading">
                <?= render("$rootPath/templates/html/toggle.html", [
                        "id" => "course-expand-button"
                ]) ?>
                <h2>Kurser</h2>
                <?= render("$rootPath/templates/html/plus.html", [
                        "id" => "add-course"
                ]) ?>
            </div>
            <div id="course-list">
                <div class="form-wrapper">
                    <form class="course-form">
                        <label class="university">Universitet:
                            <textarea class="university auto-grow" name="university" autocomplete="off"></textarea>
                        </label>
                        <label class="name">Kursnamn:
                            <textarea class="name auto-grow" name="name" autocomplete="off"></textarea>
                        </label>
                        <label class="credit">Högskolepoäng:
                            <input class="credit" name="credit" type="number" autocomplete="off">
                        </label>
                        <label class="date">Start datum:
                            <input class="date" name="startDate" type="date" autocomplete="off">
                        </label>
                        <label class="date">Slut Datum:
                            <input class="date" name="endDate" type="date" autocomplete="off">
                        </label>
                    </form>
                    <div class="form-controls">
                        <?php
                        include "$rootPath/templates/html/arrow-up.html";
                        include "$rootPath/templates/html/cross.html";
                        include "$rootPath/templates/html/arrow-down.html";
                        ?>
                    </div>
                </div>
                <div class="form-wrapper">
                    <form class="course-form">
                        <label class="university">Universitet:
                            <textarea class="university auto-grow" name="university" autocomplete="off"></textarea>
                        </label>
                        <label class="name">Kursnamn:
                            <textarea class="name auto-grow" name="name" autocomplete="off"></textarea>
                        </label>
                        <label class="credit">Högskolepoäng:
                            <input class="credit" name="credit" type="number" autocomplete="off">
                        </label>
                        <label class="date">Start datum:
                            <input class="date" name="startDate" type="date" autocomplete="off">
                        </label>
                        <label class="date">Slut Datum:
                            <input class="date" name="endDate" type="date" autocomplete="off">
                        </label>
                    </form>
                    <div class="form-controls">
                        <?php
                        include "$rootPath/templates/html/arrow-up.html";
                        include "$rootPath/templates/html/cross.html";
                        include "$rootPath/templates/html/arrow-down.html";
                        ?>
                    </div>
                </div>
                <div class="form-wrapper">
                    <form class="course-form">
                        <label class="university">Universitet:
                            <textarea class="university auto-grow" name="university" autocomplete="off"></textarea>
                        </label>
                        <label class="name">Kursnamn:
                            <textarea class="name auto-grow" name="name" autocomplete="off"></textarea>
                        </label>
                        <label class="credit">Högskolepoäng:
                            <input class="credit" name="credit" type="number" autocomplete="off">
                        </label>
                        <label class="date">Start datum:
                            <input class="date" name="startDate" type="date" autocomplete="off">
                        </label>
                        <label class="date">Slut Datum:
                            <input class="date" name="endDate" type="date" autocomplete="off">
                        </label>
                    </form>
                    <div class="form-controls">
                        <?php
                        include "$rootPath/templates/html/arrow-up.html";
                        include "$rootPath/templates/html/cross.html";
                        include "$rootPath/templates/html/arrow-down.html";
                        ?>
                    </div>
                </div>
                <div class="form-wrapper">
                    <form class="course-form">
                        <label class="university">Universitet:
                            <textarea class="university auto-grow" name="university" autocomplete="off"></textarea>
                        </label>
                        <label class="name">Kursnamn:
                            <textarea class="name auto-grow" name="name" autocomplete="off"></textarea>
                        </label>
                        <label class="credit">Högskolepoäng:
                            <input class="credit" name="credit" type="number" autocomplete="off">
                        </label>
                        <label class="date">Start datum:
                            <input class="date" name="startDate" type="date" autocomplete="off">
                        </label>
                        <label class="date">Slut Datum:
                            <input class="date" name="endDate" type="date" autocomplete="off">
                        </label>
                    </form>
                    <div class="form-controls">
                        <?php
                        include "$rootPath/templates/html/arrow-up.html";
                        include "$rootPath/templates/html/cross.html";
                        include "$rootPath/templates/html/arrow-down.html";
                        ?>
                    </div>
                </div>
            </div>
        </section>
        <section>
            <h2>Jobs</h2>
        </section>
        <section>
            <h2>Webbplatser</h2>
        </section>
    </main>
</div>
<?php include "$rootPath/templates/php/footer.php"; ?>
</body>
</html>