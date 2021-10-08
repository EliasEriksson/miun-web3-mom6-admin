<?php

/**
 * renders an htmlTemplate to HTML
 *
 * all keys in the associative array are used to replace the {{ variables }} in the template.
 * if a variable is found it is replaced with the value for the key in the context.
 *
 * if there are still {{ variables }} left in the template after the replacement
 * is done null is returned instead.
 *
 * @param string $template path to a htmlTemplate
 * @param array $context
 * @return string|null
 */
function render(string $template, array $context): ?string
{
    $template = file_get_contents($template);

    foreach ($context as $variable => $value) {
        $template = preg_replace("/{{\s*$variable\s*}}/", $value, $template);
    }
    if (preg_match_all("/{{[^}]*}}/", $template)) {
        return null;
    } else {
        return $template;
    }
}