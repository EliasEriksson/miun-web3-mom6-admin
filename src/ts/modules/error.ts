import {ContentType, ContentErrors} from "./constants.js";

/**
 * applies an error shake for a duration on a HTMLElement.
 *
 * @param element: HTMLElement to shake.
 * @param duration: shake duration.
 */
export const shake = (element: HTMLElement, duration: number = 800) => {
    element.classList.add("error-shake");
    setTimeout(() => {
        element.classList.remove("error-shake");
    }, duration);
}

/**
 * write a collection of errors to a HTMLParagraphElement
 *
 * The course here is not really a course. its more of
 * a {[key: string]: string} type but its not necessary to specify in this case.
 *
 * @param content: Errors from a request where courses should have been given by a successful request.
 * @param errorElement: HTMLParagraphElement to write the errors to
 * @param translation
 */
export const writeErrors = (content: ContentErrors, errorElement: HTMLParagraphElement, translation: { [key: string]: string }) => {
    let errors: string[] = [];
    for (const attribute in content) {
        errors.push(`${translation[attribute]}: ${content[attribute].join(" ")} `);
    }
    errorElement.innerText = errors.join(" ");
}