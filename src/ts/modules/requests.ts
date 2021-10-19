import {apiURL, RequestMethods} from "./constants.js";

/**
 * requests an api key for a specific user.
 *
 * @param username: the users username
 * @param password: the users password.
 */
export const requestToken = async (username: string, password: string): Promise<[{[key: string]: string}, number]> => {
    let response =  await fetch(`${apiURL.href}token/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    });
    return [await response.json(), response.status];
}

/**
 * a general function to preform GET / POST / PUT / DELETE request.
 *
 * necessary headers will be set as needed.
 *
 * @param endpoint: the api endpoint to request
 * @param token: the authentication token. required for POST / PUT / DELETE.
 * @param method: the request method.
 * @param data: general data to be sent with the request.
 */
export const requestEndpoint = async (
    endpoint: string,
    token: string|null,
    method: RequestMethods = "GET",
    data: {[key: string]: any}|undefined = undefined): Promise<[any, number]> => {
    let init: RequestInit = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    }
    if (token) {
        init.headers["Authorization"] = `Token ${token}`;
    }
    if (data) {
        init["body"] = JSON.stringify(data);
    }

    let response = await fetch(`${apiURL.href}${endpoint}`, init);
    if (method === "DELETE") {
        return [null, response.status];
    }
    return [await response.json(), response.status];
}

/**
 * request file from the template directory.
 *
 * this template will be used with the render function in xrender.ts
 *
 * @param templateName: filename of the template.
 */
export const requestTemplate = async (templateName: string) => {
    let response = await fetch(`./templates/html/${templateName}`);
    return  await response.text();
}