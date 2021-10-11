import {requestEndpoint, requestTemplate} from "./modules/requests.js";
import {ApiGetResponse, Course, Callable, Job, WebPage} from "./modules/constants.js";
import {render} from "./modules/xrender.js";
import {autoGrow} from "./modules/triggers.js";

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

    toggleOn = () => {
        if (!this.on) {
            this.htmlElement.classList.add("rotate-90deg");
            this.toggleHtmlElement.style.height = `${this.toggleHtmlElement.scrollHeight}px`;
            this.on = true;
        }
    }

    toggleOff = () => {
        if (this.on) {
            setTimeout(() => {
                this.htmlElement.classList.remove("rotate-90deg");
            }, 800);
            this.toggleHtmlElement.style.height = `${0}px`;
            this.on = false;
        }
    }

    toggle = () => {
        if (this.on) {
            this.toggleOff();
        } else {
            this.toggleOn();
        }
    }
}


class Content<T extends { [key: string]: any }> {
    private readonly template;
    private readonly original: T;
    private readonly signal: Callable;
    private master: ContentManager<T>;
    private content: T;
    private contentElements: {[key: string]: HTMLInputElement|HTMLTextAreaElement};

    constructor(content: T, template: string, signal: Callable) {
        this.original = {...content};
        this.content = content;
        this.template = template;
        this.signal = signal;
        this.contentElements = {};
    }

    private addListener = (element: HTMLInputElement|HTMLTextAreaElement, key: string): void =>  {
        element.addEventListener("input", () => {
            // @ts-ignore
            this.content[key] = element.value;
            this.signal();
        })
    }

    render = () => {
        let contentNode = <HTMLDivElement>render(this.template, this.content);
        let element: HTMLInputElement|HTMLTextAreaElement;
        let moveUpElement, undoElement, deleteElement, moveDownElement: HTMLElement;

        for (const contentKey in this.content) {
            element = <HTMLInputElement|HTMLTextAreaElement>contentNode.querySelector(`[name=${contentKey}]`);
            moveUpElement = element.querySelector(".move-up-button");
            moveDownElement = element.querySelector(".move-down-button");
            undoElement = element.querySelector(".undo-button");
            deleteElement = element.querySelector(".delete-button");

            if (element) {
                if (element instanceof HTMLTextAreaElement) {
                    autoGrow(element);
                }
                this.contentElements[contentKey] = element;
                this.addListener(element, contentKey);
            }
        }
        return contentNode;
    }

    changed = (): boolean => {
        return JSON.stringify(this.original) !== JSON.stringify(this.content);
    }

    revertChanges = () => {
        if (Object.keys(this.contentElements).length) {
            for (const key in this.contentElements) {
                // @ts-ignore
                this.contentElement[key].value = this.original[key];
            }
        }
    }
}


abstract class ContentManager<T> {
    private readonly token: string;
    private readonly endpoint: string;
    private readonly contentTemplate: string;

    private resultListElement: HTMLDivElement;
    private content: Content<T>[];

    constructor(token: string, endpoint: string, contentTemplate: string, resultListElement: HTMLDivElement) {
        this.token = token;
        this.endpoint = endpoint;
        this.contentTemplate = contentTemplate;
        this.resultListElement = resultListElement;
    }

    createContent = (content) => {
        return new Content<T>(content, this.contentTemplate, this.changed);
    }

    getRequest = async () => {
        this.resultListElement.innerHTML = "";
        let [initialResponse, initialStatus]: [ApiGetResponse<T>, number] = await requestEndpoint(
            this.endpoint, this.token
        );
        if (200 <= initialStatus && initialStatus < 300) {
            this.content = initialResponse.results.map(result => {
                return this.createContent(result)
            });
            if (initialResponse.next) {
                let nextURL = new URL(initialResponse.next);
                let limit = parseInt(nextURL.searchParams.get("limit"));
                let [followupResponse, followupStatus]: [ApiGetResponse<T>, number] = await requestEndpoint(
                    `${this.endpoint}?limit=${initialResponse.count - limit}&offset=${limit}`, this.token
                );
                if (200 <= followupStatus && followupStatus < 300) {
                    this.content.push(
                        ...followupResponse.results.map(
                            result => this.createContent(result)
                        )
                    );
                }
            }
            this.renderContent();
        }
    }

    renderContent = () => {
        for (const contentElement of this.content) {
            this.resultListElement.appendChild(contentElement.render());
        }
    }

    changed = (): boolean => {
        for (const contentElement of this.content) {
            if (contentElement.changed()) {
                return true;
            }
        }
        return false;
    }

    revertAllChanges = () => {
        for (const contentElement of this.content) {
            contentElement.revertChanges();
        }
    }
}

class CourseContentManager extends ContentManager<Course> {
    static create = async (token: string): Promise<CourseContentManager> => {
        let contentTemplate = await requestTemplate("course.html");
        return new CourseContentManager(
            token, "courses/",
            contentTemplate,
            <HTMLDivElement>document.getElementById("course-list")
        );
    }
}

class JobContentManager extends ContentManager<Job> {
    static create = async (token: string): Promise<JobContentManager> => {
        let jobTemplate = await requestTemplate("job.html");
        return new JobContentManager(
            token, "jobs/", jobTemplate,
            <HTMLDivElement>document.getElementById("job-list")
        );
    }
}

class WebPageContentManager extends ContentManager<WebPage> {
    static create = async (token: string): Promise<WebPageContentManager> => {
        let webPageTemplate = await requestTemplate("webpage.html");
        return new WebPageContentManager(
            token, "webpages/", webPageTemplate,
            <HTMLDivElement>document.getElementById("webpage-list")
        );
    }
}

window.addEventListener("load", async () => {
    const addCourseElement = document.getElementById("add-course");
    const addJobElement = document.getElementById("add-job");
    const addWebPage = document.getElementById("add-webpage");

    let courseToggle = new Toggle(
        document.getElementById("course-expand-button"),
        document.getElementById("course-list")
    );
    let jobToggle = new Toggle(
        document.getElementById("job-expand-button"),
        document.getElementById("job-list")
    );
    let webPageToggle = new Toggle(
        document.getElementById("webpage-expand-button"),
        document.getElementById("webpage-list")
    );
    addCourseElement.addEventListener("click", courseToggle.toggleOn);
    addJobElement.addEventListener("click", jobToggle.toggleOn);
    addWebPage.addEventListener("click", webPageToggle.toggleOn);

    const token = localStorage.getItem("token");
    let courseContentManager = CourseContentManager.create(token).then(manager => {
        return [manager, manager.getRequest()]
    }).then(manager => manager);

    let jobContentManager = JobContentManager.create(token).then(manager => {
        return [manager, manager.getRequest()]
    }).then(manager => manager);

    let webPageContentManager = WebPageContentManager.create(token).then(manager => {
        return [manager, manager.getRequest()]
    }).then(manager => manager);
});


