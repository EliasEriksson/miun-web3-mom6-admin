<?php include_once __DIR__ . "/config.php"; ?>
<!doctype html>
<html lang="sv">
<head>
    <?php include "$rootPath/templates/php/head.php"; ?>
    <title>Admin</title>
</head>
<body>
<?php include "$rootPath/templates/php/header.php" ?>
<div class="main-wrapper">
    <main>
        <h1>Admin</h1>
        <section class="course-section">
            <div class="section-heading">
                <h2>Kurser</h2>
                <?php include "$rootPath/templates/html/plus.html"; ?>
            </div>
            <div class="form-wrapper">
                <form class="course-form">
                    <div>
                        <label class="university">Universitet:
                            <input class="university" name="university" type="text" autocomplete="off">
                        </label>
                        <label class="name">Kursnamn:
                            <input class="name" name="name" type="text" autocomplete="off">
                        </label>
                    </div>
                    <div>
                        <label class="credit">Högskolepoäng:
                            <input class="credit" name="credit" type="number" autocomplete="off">
                        </label>
                        <label class="date">Start datum:
                            <input class="date" name="startDate" type="date" autocomplete="off">
                        </label>
                        <label class="date">Slut Datum:
                            <input class="date" name="endDate" type="date" autocomplete="off">
                        </label>
                    </div>
                </form>
                <div class="course-form-controls">
                    <?php
                    include "$rootPath/templates/html/arrow-up.html";
                    include "$rootPath/templates/html/cross.html";
                    include "$rootPath/templates/html/arrow-down.html";
                    ?>
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