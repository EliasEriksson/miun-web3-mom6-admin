import {requestToken} from "./modules/requests.js";
import {redirect} from "./modules/redirect.js";


if (localStorage.getItem("token")) {
    redirect("../");
}
