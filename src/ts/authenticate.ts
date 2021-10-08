import {requestToken} from "./modules/requests.js";
import {redirect} from "./modules/redirect.js";


if (localStorage.getItem("token")) {
    redirect("../");
}


window.addEventListener("load", () => {
    let usernameElement = <HTMLInputElement>document.getElementById("username");
    let passwordElement = <HTMLInputElement>document.getElementById("password");
    let loginButtonElement = <HTMLInputElement>document.getElementById("login-button");

    loginButtonElement.addEventListener("click", async (event) => {
        event.preventDefault();
        let token: {token: string} = await requestToken(
            usernameElement.value, passwordElement.value
        );
        if (token.token) {
            localStorage.setItem("token", token.token);
            redirect("../");
        }
    })
})
