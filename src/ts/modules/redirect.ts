/**
 * adds the path 'to' to the 'from' url
 *
 * modifies the given URL in place and returns the URL object as well.
 *
 * @param from: a URL object, this will almost always be set to currentURL.
 * @param to: a string to add onto the URL pathname.
 */
export const updateURL = (from: URL, to: string): URL => {
    let url = new URL(from.href);
    if (to.startsWith("/")) {
        // absolute URL
        url.pathname = to;
    } else {
        // relative URL
        if (url.pathname.endsWith("/")) {
            // to did not specify a file (.../) in the request
            // so the to location can simply be added on top of it.
            url.pathname += to;
        } else {
            // to does specify a specific file (.../index.html) in the request
            // so the location is added onto before the file.
            // hopefully the file was index.html otherwise it most likely will fail.
            let pathParts = url.pathname.split("/");
            if (to.endsWith("/")) {
                pathParts[pathParts.length - 2] += `/${to.substring(0, to.length - 1)}`
            } else {
                pathParts[pathParts.length - 2] += `/${to}`;
            }
            url.pathname = pathParts.join("/");
        }
    }
    return url;
}


/**
 * redirects the user from one page to another.
 *
 * @param to: where to redirect to.
 */
export const redirect = (to: string): never => {
    document.location.href = updateURL(new URL(window.location.href), to).href;
    throw "Redirecting"; // adding this so ts understands this function never returns
}
