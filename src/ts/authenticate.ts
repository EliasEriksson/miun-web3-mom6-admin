import {requestToken} from "./modules/requests.js";
import {redirect} from "./modules/redirect.js";
import {shake} from "./modules/error.js";

// if already logged in redirect to the admin site
if (localStorage.getItem("web3mom6token")) {
    redirect("../");
}


window.addEventListener("load", () => {
    const formElement = <HTMLElement>document.querySelector(".login-form");
    const errorElement = <HTMLParagraphElement>document.querySelector(".error");
    const usernameElement = <HTMLInputElement>document.getElementById("username");
    const passwordElement = <HTMLInputElement>document.getElementById("password");
    const loginButtonElement = <HTMLInputElement>document.getElementById("login-button");

    loginButtonElement.addEventListener("click", async (event) => {
        event.preventDefault();
        // requests the token
        let [token, status] = await requestToken(
            usernameElement.value, passwordElement.value
        );
        // if successful set the token and redirect
        // else show the error and some nice UX effects
        if (200 <= status && status < 300) {
            localStorage.setItem("web3mom6token", token.token);
            redirect("../");
        } else {
            errorElement.innerHTML = "Fel inloggningsuppgifter.";
            shake(formElement);
        }
    })
})
