import {requestToken} from "./modules/requests.js";
import {redirect} from "./modules/redirect.js";
import {shake} from "./modules/error.js";


if (localStorage.getItem("token")) {
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
        let [token, status] = await requestToken(
            usernameElement.value, passwordElement.value
        );
        if (200 <= status && status < 300) {
            localStorage.setItem("token", token.token);
            redirect("../");
        } else {
            errorElement.innerHTML = "Fel inloggningsuppgifter.";
            shake(formElement);
        }
    })
})
