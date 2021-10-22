import {requestEndpoint, requestTemplate} from "./modules/requests.js";
import {
    ApiEndpoint,
    ApiGetResponse,
    Callable,
    ContentErrors,
    ContentType,
    Course,
    Job, translateCourse,
    WebPage
} from "./modules/constants.js";
import {render} from "./modules/xrender.js";
import {autoGrow} from "./modules/triggers.js";
import {redirect} from "./modules/redirect.js";
import {shake, writeErrors} from "./modules/error.js";

/**
 * redirect the user to login if the user does not have a token
 */
if (!localStorage.getItem("web3mom6token")) {
    redirect("authenticate/")
}


/**
 * helper function to toggle a class on / off
 * @param element: HTMLElement to toggle the class on
 * @param cls: the css class
 */
const toggleClass = (element: HTMLElement, cls: string) => {
    if (element.classList.contains(cls)) {
        element.classList.remove(cls);
    } else {
        element.classList.add(cls);
    }
}

/**
 * a class to represent the drop-down menu toggle button
 *
 * this class is unnecessary but too little time to remove it
 */
class Toggle {
    private htmlElement: HTMLElement;
    private toggleHtmlElement: HTMLElement
    private on: boolean;

    constructor(htmlElement: HTMLElement, toggleHtmlElement: HTMLElement) {
        this.htmlElement = htmlElement;
        this.toggleHtmlElement = toggleHtmlElement;
        this.on = false;
        this.htmlElement.addEventListener("click", this.toggle);
    }

    /**
     * toggles the menu on
     */
    toggleOn = () => {
        if (!this.on) {
            this.htmlElement.classList.add("rotate-90deg");
            this.toggleHtmlElement.style.height = `${this.toggleHtmlElement.scrollHeight}px`;
            this.on = true;
        }
    }

    /**
     * toggles the menu off
     */
    toggleOff = () => {
        if (this.on) {
            this.htmlElement.classList.remove("rotate-90deg");
            this.toggleHtmlElement.style.height = `${0}px`;
            this.on = false;
        }
    }

    /**
     * toggles the menu to the oposite
     */
    toggle = () => {
        if (this.on) {
            this.toggleOff();
        } else {
            this.toggleOn();
        }
    }
}

/**
 * represents a single item in the drop-down menu
 *
 * wraps around an object and keeps it in sync with its related inputs.
 * a copy of the original object is kept to help determine when to show the
 * undo button and what to undo to.
 */
class Content<T extends ContentType> {
    private readonly template;
    private original: T;
    private master: ContentManager<T>;
    private readonly content: T;
    private readonly contentElements: { [key: string]: HTMLInputElement | HTMLTextAreaElement };

    private contentNode: HTMLElement | null;
    private undoButtonElement: HTMLElement | null;
    private moveUpButtonElement: HTMLElement | null;
    private moveDownButtonElement: HTMLElement | null;
    private errorElement: HTMLParagraphElement | null;

    constructor(content: T, template: string, master: ContentManager<T>) {
        // if there is a null endDate convert to string. null endDate means current
        if (content["endDate"] !== undefined && content["endDate"] === null) {
            content["endDate"] = "";
        }
        // copies teh primitive types from given content to an original copy.
        // works since primitives are not passed by reference
        this.original = {...content};
        this.content = content;
        this.template = template;

        // a reference to the ContentManager where this content is part of.
        this.master = master;
        this.contentElements = {};

        this.contentNode = null;
        this.undoButtonElement = null;
        this.moveUpButtonElement = null;
        this.moveDownButtonElement = null;
        this.errorElement = null;
    }

    /**
     * updates the original content to the current content
     */
    updateOriginal = () => {
        this.original = {...this.content}
        this.toggleUndo();
    }

    /**
     * if the list is changed the undo is toggled.
     */
    toggleUndo = () => {
        if (this.changed()) {
            if (this.undoButtonElement.classList.contains("disabled")) {
                this.undoButtonElement.classList.remove("disabled");
            }
        } else {
            if (!this.undoButtonElement.classList.contains("disabled")) {
                this.undoButtonElement.classList.add("disabled");
            }
        }
    }

    /**
     * hides the move up button
     */
    hideMoveUp = () => {
        if (!this.moveUpButtonElement.classList.contains("invisible")) {
            this.moveUpButtonElement.classList.add("invisible");
        }
    }

    /**
     * shows the move up button
     */
    showMoveUp = () => {
        if (this.moveUpButtonElement.classList.contains("invisible")) {
            this.moveUpButtonElement.classList.remove("invisible");
        }
    }

    /**
     * hides the move down button
     */
    hideMoveDown = () => {
        if (!this.moveDownButtonElement.classList.contains("invisible")) {
            this.moveDownButtonElement.classList.add("invisible");
        }
    }

    /**
     * shows the move down button
     */
    showMoveDown = () => {
        if (this.moveDownButtonElement.classList.contains("invisible")) {
            this.moveDownButtonElement.classList.remove("invisible");
        }
    }

    /**
     * scrolls the document so this element is in the middle of the screen
     */
    scrollTo = () => {
        let space = (window.innerHeight - this.contentNode.scrollHeight) / 2;
        window.scrollTo(window.scrollX, window.scrollY + this.contentNode.getBoundingClientRect().top - space);
    }

    /**
     * renders the HTML from the given content object.
     *
     * the whole contentNode is rendered with xRender then all input elements are queried with
     * querySelector.
     *
     * all the inputs gets necessary event listeners
     */
    render = () => {
        let contentNode = <HTMLDivElement>render(this.template, this.content);
        this.contentNode = contentNode;
        this.errorElement = <HTMLParagraphElement>contentNode.querySelector(".error");
        this.undoButtonElement = <HTMLElement>contentNode.querySelector(".undo-button");
        this.moveUpButtonElement = <HTMLElement>contentNode.querySelector(".move-up-button");
        this.moveDownButtonElement = <HTMLElement>contentNode.querySelector(".move-down-button");

        /**
         * prevents the page from being refreshed if user hits enter on a form input
         */
        contentNode.querySelector("form").addEventListener("submit", e => e.preventDefault);

        /**
         * if the undo element is clicked the changes are reverted,
         * the content manager is "signaled" to do whatever it needs to do on an undo
         * and the undo buttons is toggled.
         */
        this.undoButtonElement.addEventListener("click", () => {
            this.revertChanges();
            this.master.undoContent();
            this.toggleUndo();
        });

        /**
         * the content manager is "signaled" to move the contentNode up
         */
        this.moveUpButtonElement.addEventListener("click", () => {
            this.master.moveContentUp(this, contentNode);
        });

        /**
         * the content manager is "signaled" to mode the contentNode down
         */
        this.moveDownButtonElement.addEventListener("click", () => {
            this.master.moveContentDown(this, contentNode);
        });
        /**
         * an alert is made for the user to confirm the deletion
         * the content manager is "signaled" to delete the contentNode
         */
        contentNode.querySelector(".delete-button").addEventListener("click", () => {
            if (confirm(`Är du säker på att du vill ta bort detta?`)) {
                this.master.deleteContent(this, contentNode);
            }
        });

        /**
         * creates an input for every input that have name attribute that matches 
         * the contents keys
         */
        for (const key in this.content) {
            let element = <HTMLInputElement | HTMLTextAreaElement>contentNode.querySelector(`[name=${key}]`);
            // if an element with a key matching an inputs name
            if (element) {
                // if its a text area add the autoGrow functionality to it
                if (element instanceof HTMLTextAreaElement) {
                    autoGrow(element);
                }
                this.contentElements[key] = element;

                /**
                 * if an input is updated store the new value of the input in the internal content object
                 * signal to the content manager that an input was updated
                 * and toggles the undo button if nessesary.
                 */
                element.addEventListener("input", () => {
                    // cast to any required or typescript gets angry even if the type is checked with typeof
                    // the type is either string or number (inferred from the type ContentType)
                    if (typeof this.content[key] === "string") {
                        this.content[key] = <any>element.value;
                    } else {
                        this.content[key] = <any>parseInt(element.value);
                    }
                    this.master.editContent(this);
                    this.toggleUndo();
                });
            }
        }
        return contentNode;
    }

    /**
     * checks if the internal content is changed from its original state
     */
    changed = (): boolean => {
        return JSON.stringify(this.original) !== JSON.stringify(this.content);
    }

    /**
     * revert the current state to the original state
     */
    revertChanges = () => {
        if (Object.keys(this.contentElements).length) {
            for (const key in this.contentElements) {
                this.contentElements[key].value = this.original[key];
                this.content[key] = this.original[key];
            }
        }
    }

    /**
     * checks if the internal content is equal to another Content objects internal content
     * @param other: another Content object
     */
    equals = (other: Content<T>) => {
        return JSON.stringify(this.content) === JSON.stringify(other.content)
    }

    /**
     * get the current order of the content in the list
     */
    getOrder = (): number => {
        return this.content.order;
    }

    /**
     * set the current order for the content in the list
     * @param order
     */
    setOrder = (order: number): void => {
        this.content.order = order;
    }

    /**
     * get a copy of the current internal content
     */
    getContent = (): T => {
        return {...this.content};
    }

    /**
     * gets the contents database ID
     *
     * if this is 0 the content is not yet in the database
     */
    getID = (): number => {
        return this.content.id;
    }

    /**
     * set the contents database ID
     *
     * this is meant to be used for when new content is pushed into the database and an ID is now know.
     * @param id: id given from database
     */
    setID = (id: number) => {
        this.content.id = id;
    }
    /**
     * writes errors to the error paragraph element
     * @param error
     * @param endpoint
     */
    writeError = (error: ContentErrors, endpoint: string) => {
        writeErrors(error, this.errorElement, translateCourse[endpoint]);
    }

    /**
     * shakes the whole contentNode
     */
    shake = () => {
        let wait = Math.abs(this.contentNode.getBoundingClientRect().top + window.scrollY) / 11
        new Promise(resolve => {
            setTimeout(resolve, wait);
        }).then(() => {
            shake(this.contentNode);
        })
    }

    /**
     * remove the error in the error element
     */
    eraseError = () => {
        this.errorElement.innerHTML = "";
    }
}

/**
 * ContentManager, this class represents a the list inside of the drop-down menu
 * the content manager wraps around a list of Content objects and is therefore tightly coupled with
 * the Content class
 *
 * this class is able to preform CRUD operations to the REST service depending on the changes to
 * the internal list of Content objects.
 *
 * if a change is made a request is prepared in the syncRequests array which are all requested
 * when the user commits changes.
 */
abstract class ContentManager<T extends ContentType> {
    protected abstract emptyContent: T;

    protected readonly token: string;
    protected readonly endpoint: ApiEndpoint;
    private readonly contentTemplate: string;

    private readonly syncRequests: Map<Content<T>, Callable>;

    protected contentListElement: HTMLDivElement;
    private commitElement: HTMLElement;
    private originalOrder: Content<T>[];
    protected content: Content<T>[];

    constructor(token: string, endpoint: ApiEndpoint, contentTemplate: string, resultListElement: HTMLDivElement, commitElement: HTMLElement) {
        this.token = token;
        this.endpoint = endpoint;
        this.contentTemplate = contentTemplate;
        this.contentListElement = resultListElement;
        this.commitElement = commitElement;
        this.content = [];
        this.originalOrder = [];
        this.syncRequests = new Map();
    }

    /**
     * moves the internal content to their original order
     */
    updateOriginal = () => {
        this.originalOrder = [...this.content];
    }

    /**
     * create a new Content object from the given emptyContent template
     *
     * @param content
     */
    createContent = (content: T) => {
        return new Content<T>(JSON.parse(JSON.stringify(content)), this.contentTemplate, this);
    }

    /**
     * acquires all the content from the given endpoint.
     *
     * the content is added to the internal list and is rendered.
     */
    getRequest = async () => {
        this.contentListElement.innerHTML = "";
        // a request for the initial content from the REST service
        let [initialResponse, initialStatus]: [ApiGetResponse<T>, number] = await requestEndpoint(
            `${this.endpoint}/`, this.token
        );
        if (200 <= initialStatus && initialStatus < 300) {
            this.content = initialResponse.results.map(result => this.createContent(result));

            // if there is more content in the database request the remainder
            if (initialResponse.next) {
                let nextURL = new URL(initialResponse.next);
                let limit = parseInt(nextURL.searchParams.get("limit"));
                let [followupResponse, followupStatus]: [ApiGetResponse<T>, number] = await requestEndpoint(
                    `${this.endpoint}/?limit=${initialResponse.count - limit}&offset=${limit}`, this.token
                );
                if (200 <= followupStatus && followupStatus < 300) {
                    this.content.push(
                        ...followupResponse.results.map(
                            result => {
                                return this.createContent(result);
                            }
                        )
                    );
                }
            }
            this.renderContent();
            this.toggleMoveButtons();
            this.originalOrder = [...this.content];
        }
    }

    /**
     * adds an internal request that should be applied when the user confirms changes
     *
     * if a request already exists the set is ignored unless its forced
     * forced is used to apply a delete request.
     *
     * @param content
     * @param request
     * @param force
     */
    setSyncRequest = (content: Content<T>, request: Callable, force = false) => {
        if (!this.syncRequests.has(content)) {
            this.syncRequests.set(content, request);
        } else {
            if (force) {
                if (content.getID()) {
                    this.syncRequests.set(content, request);
                } else {
                    this.removeSyncRequest(content);
                }
            }
        }
    }

    /**
     * removed a request from the internal list
     *
     * @param content
     */
    removeSyncRequest = (content: Content<T>) => {
        if (this.syncRequests.has(content)) {
            this.syncRequests.delete(content);
        }
    }

    /**
     * sends all the internal sync requests
     *
     * if there is an error the first one is saved and some nice UX effects are applied to it
     *
     * this method can be improved by using Promise.allSettled() but no time to implement
     */
    syncRequest = async () => {
        this.content.forEach((content, index) => {
            if (content.getOrder() !== index) {
                content.setOrder(index);
                this.setSyncRequest(content, async () => {
                    return await requestEndpoint(`${this.endpoint}/${content.getID()}/`, this.token, "PUT", content.getContent());
                });
            }
        });

        let contentError: Content<T>;
        for await (let [content, request] of this.syncRequests) {
            let [response, status] = await request();
            if (200 <= status && status < 300) {
                content.updateOriginal();
                this.removeSyncRequest(content);
            } else {
                if (!contentError) {
                    contentError = content;
                }
                content.writeError(<ContentErrors>response, this.endpoint);
            }
        }
        this.contentListElement.style.height = `${this.contentListElement.scrollHeight}px`;
        if (contentError) {
            contentError.scrollTo();
            contentError.shake()
        }
        this.updateOriginal();
        this.toggleCommit();
    }

    /**
     * tender all the content to the DOM
     */
    renderContent = () => {
        for (const content of this.content) {
            this.contentListElement.appendChild(content.render());
        }
    }

    /**
     * checks if the internal list of Content is changed.
     *
     * true if:
     *  1: the length of the list is changed
     *  2: any internal Content objects are changed
     *  3: the order of the Content is changed
     *  4: a specific contents order does not match its internal order
     */
    changed = (): boolean => {
        if (this.content.length === this.originalOrder.length) {
            for (let i = 0; i < this.content.length; i++) {
                if (this.content[i].changed()) {
                    return true;
                }
                if (!this.content[i].equals(this.originalOrder[i])) {
                    return true;
                }
                if (this.content[i].getOrder() !== i) {
                    return true;
                }
            }
        } else {
            return true;
        }
        return false;
    }

    /**
     * toggles the commit button if the Content manager is concidered changed
     */
    toggleCommit = () => {
        if (!this.changed()) {
            if (!this.commitElement.classList.contains("disabled")) {
                this.commitElement.classList.add("disabled");
            }
        } else {
            if (this.commitElement.classList.contains("disabled")) {
                this.commitElement.classList.remove("disabled");
            }
        }
    }

    /**
     * toggles the movbe buttons
     * toggles all the buttons on
     * then the top most Contents move up is turned off
     * then the bottom most Contents move down is turned off
     */
    toggleMoveButtons = () => {
        this.content.forEach(content => {
            content.showMoveUp();
            content.showMoveDown();
        })
        if (this.content.length) {
            this.content[0].hideMoveUp();
            this.content[this.content.length - 1].hideMoveDown();
        }
    }

    /**
     * adds a new empty content to the list
     */
    addContent = () => {
        let content = this.createContent(this.emptyContent);
        let contentNode = content.render();
        this.content.splice(0, 0, content);
        this.contentListElement.insertBefore(contentNode, this.contentListElement.firstChild);

        this.toggleMoveButtons();
        this.toggleCommit();
        content.scrollTo();

        this.setSyncRequest(content, async () => {
            let [response, status]: [T | ContentErrors, number] = await requestEndpoint(
                `${this.endpoint}/`, this.token, "POST", content.getContent()
            );
            if (200 <= status && status < 300) {
                content.setID((<T>response).id);
            }
            return [response, status]
        });
        this.contentListElement.style.height = `${this.contentListElement.scrollHeight}px`;
    }

    /**
     * move a contentNode higher up in the list and update the order
     *
     * @param content: a reference to the content object
     * @param contentNode to be moved up: the content objects contentNode (should have been given by a get method)
     */
    moveContentUp = (content: Content<T>, contentNode: HTMLDivElement): void => {
        let index = this.content.indexOf(content);
        if (index > 0) {
            this.content.splice(index, 1);
            this.content.splice(index - 1, 0, content);
            this.contentListElement.insertBefore(contentNode, contentNode.previousSibling);

        }

        this.toggleMoveButtons();
        this.toggleCommit();
        content.scrollTo();
    }

    /**
     * move a contentNode lower down in the list and update the order
     *
     * @param content a reference to the content object
     * @param contentNode the content objects contentNode (should have been given by a get method)
     */
    moveContentDown = (content: Content<T>, contentNode: HTMLDivElement) => {
        let index = this.content.indexOf(content);
        if (index < this.content.length) {
            this.content.splice(index, 1);
            this.content.splice(index + 1, 0, content);
            this.contentListElement.insertBefore(contentNode.nextSibling, contentNode);
        }

        this.toggleMoveButtons();
        this.toggleCommit();
        content.scrollTo();
    }

    /**
     * deletes a content from the list
     *
     * @param content: the content to be deleted
     * @param contentNode: the content node to be deleted (should have been given by a get method)
     */
    deleteContent = (content: Content<T>, contentNode: HTMLDivElement) => {
        let index = this.content.indexOf(content);
        if (index > -1) {
            let currentHeight = this.contentListElement.scrollHeight;
            let newHeight;

            if (this.content.length === 1) {
                newHeight = 0;
            } else {
                let margin = (currentHeight - Array.from(
                    this.contentListElement.children
                ).map(
                    child => child.scrollHeight
                ).reduce((total, current) => {
                    return total + current;
                })) / this.content.length;
                newHeight = currentHeight - this.contentListElement.children[index].scrollHeight - margin;
            }
            this.content.splice(index, 1);
            this.contentListElement.removeChild(contentNode);
            this.contentListElement.style.height = `${newHeight}px`;
            
            // forces a delete request to trumph other potential POST / PUT request
            this.setSyncRequest(content, async () => {
                return await requestEndpoint(`${this.endpoint}/${content.getID()}/`, this.token, "DELETE", content.getContent());
            }, true);
        }
        this.toggleCommit();
        this.toggleMoveButtons();
    }

    /**
     * if the content is changed add a sync request
     * @param content
     */
    editContent = (content: Content<T>) => {
        if (content.changed()) {
            this.setSyncRequest(content, async () => {
                return await requestEndpoint(`${this.endpoint}/${content.getID()}/`, this.token, "PUT", content.getContent());
            })
        }
        this.toggleCommit();
        this.contentListElement.style.height = `${this.contentListElement.scrollHeight}px`;
    }

    /**
     * the main undoing is from the Content object itself. this method is just finishing the job
     */
    undoContent = () => {
        this.toggleCommit();
    }
}

/**
 * Specializes the Content manager to handle Course content
 */
class CourseContentManager extends ContentManager<Course> {
    emptyContent = {
        id: 0,
        university: "",
        name: "",
        credit: 0,
        startDate: "",
        endDate: "",
        order: -1
    };

    static create = async (token: string, commitElement: HTMLElement): Promise<CourseContentManager> => {
        let contentTemplate = await requestTemplate("course.html");
        return new CourseContentManager(
            token, "courses",
            contentTemplate,
            <HTMLDivElement>document.getElementById("course-list"),
            commitElement
        );
    }
}

/**
 * Specializes the Content manager to handle job content
 */
class JobContentManager extends ContentManager<Job> {
    emptyContent = {
        id: 0,
        company: "",
        title: "",
        startDate: "",
        endDate: "",
        order: -1
    }

    static create = async (token: string, commitElement: HTMLElement): Promise<JobContentManager> => {
        let jobTemplate = await requestTemplate("job.html");
        return new JobContentManager(
            token, "jobs", jobTemplate,
            <HTMLDivElement>document.getElementById("job-list"),
            commitElement
        );
    }
}

/**
 * Specializes the Content manager to handle the webpage content
 */
class WebPageContentManager extends ContentManager<WebPage> {
    emptyContent = {
        id: 0,
        title: "",
        description: "",
        url: "",
        order: -1
    }

    static create = async (token: string, commitElement: HTMLElement): Promise<WebPageContentManager> => {
        let webPageTemplate = await requestTemplate("webpage.html");
        return new WebPageContentManager(
            token, "webpages", webPageTemplate,
            <HTMLDivElement>document.getElementById("webpage-list"),
            commitElement
        );
    }
}


/**
 * this is not a beautiful sight but it works
 *
 * can be fixed by moving all the queried HTML elements to global scope
 * and modifying the Specialized Content manager class
 * but there is no time.
 */
window.addEventListener("load", async () => {
    const addCourseElement = document.getElementById("add-course");
    const addJobElement = document.getElementById("add-job");
    const addWebPage = document.getElementById("add-webpage");

    const commitCourseChangesElement = document.getElementById("apply-courses");
    const commitJobChangesElement = document.getElementById("apply-jobs");
    const commitWebPageChangesElement = document.getElementById("apply-webpages");

    const courseLoadingElement = document.getElementById("course-loading");
    const jobLoadingElement = document.getElementById("job-loading");
    const websiteLoadingElement = document.getElementById("website-loading");

    // setting upp the drop-down menu toggles
    const courseToggle = new Toggle(
        document.getElementById("course-expand-button"),
        document.getElementById("course-list")
    );
    const jobToggle = new Toggle(
        document.getElementById("job-expand-button"),
        document.getElementById("job-list")
    );
    const webPageToggle = new Toggle(
        document.getElementById("webpage-expand-button"),
        document.getElementById("webpage-list")
    );

    // acquiring the token
    const token = localStorage.getItem("web3mom6token");

    // sets up the specific content managers
    CourseContentManager.create(
        token, commitCourseChangesElement
    ).then(async manager => {
        await manager.getRequest();
        addCourseElement.addEventListener("click", () => {
            courseToggle.toggleOn();
            manager.addContent();
        });
        commitCourseChangesElement.addEventListener("click", async () => {
            if (commitCourseChangesElement.classList.contains("disabled")) {
                return;
            }
            if (confirm("Är du säker på att du vill applicera ändringarna gjorda till alla kurser?")) {
                toggleClass(courseLoadingElement, "disabled");
                await manager.syncRequest();
                toggleClass(courseLoadingElement, "disabled");
            }
        });
        return manager;
    });

    JobContentManager.create(
        token, commitJobChangesElement
    ).then(async manager => {
        await manager.getRequest();
        addJobElement.addEventListener("click", () => {
            jobToggle.toggleOn();
            manager.addContent();
        });
        commitJobChangesElement.addEventListener("click", async () => {
            if (commitJobChangesElement.classList.contains("disabled")) {
                return;
            }
            if (confirm("Är du säker på att du vill applicera ändringarna gjorda till alla jobb?")) {
                toggleClass(jobLoadingElement, "disabled");
                await manager.syncRequest();
                toggleClass(jobLoadingElement, "disabled");
            }
        });
        return manager;
    });

    WebPageContentManager.create(
        token, commitWebPageChangesElement
    ).then(async manager => {
        await manager.getRequest();
        addWebPage.addEventListener("click", () => {
            webPageToggle.toggleOn();
            manager.addContent();
        });
        commitWebPageChangesElement.addEventListener("click", async () => {
            if (commitWebPageChangesElement.classList.contains("disabled")) {
                return;
            }
            if (confirm("Är du säker på att du vill applicera ändringarna gjorda till alla webbplatser?")) {
                toggleClass(websiteLoadingElement, "disabled");
                await manager.syncRequest();
                toggleClass(websiteLoadingElement, "disabled");
            }
        });
        return manager
    });
});
