import {requestEndpoint, requestTemplate} from "./modules/requests.js";
import {ApiEndpoint, ApiGetResponse, Callable, Course, Job, WebPage} from "./modules/constants.js";
import {render} from "./modules/xrender.js";
import {autoGrow} from "./modules/triggers.js";
import {redirect} from "./modules/redirect.js";

if (!localStorage.getItem("token")) {
    redirect("authenticate/")
}


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
            this.htmlElement.classList.remove("rotate-90deg");
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
    private original: T;
    private master: ContentManager<T>;
    private content: T;
    private contentElements: { [key: string]: HTMLInputElement | HTMLTextAreaElement };
    
    private contentNode: HTMLElement|null;
    private undoButtonElement: HTMLElement|null;
    private moveUpButtonElement: HTMLElement|null;
    private moveDownButtonElement: HTMLElement|null;

    constructor(content: T, template: string, master: ContentManager<T>) {
        this.original = {...content};
        this.content = content;
        this.template = template;
        this.master = master;
        this.contentElements = {};

        this.contentNode = null;
        this.undoButtonElement = null;
        this.moveUpButtonElement = null;
        this.moveDownButtonElement = null;
    }

    updateOriginal = () => {
        this.original = {...this.content}
    }

    private addInputListener = (contentNode: HTMLDivElement, element: HTMLInputElement | HTMLTextAreaElement, key: string): void => {
        element.addEventListener("input", () => {
            // @ts-ignore
            this.content[key] = element.value;
            this.master.editContent(this);
            this.toggleUndo();
        })
    }

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

    hideMoveUp = () => {
        if (!this.moveUpButtonElement.classList.contains("invisible")) {
            this.moveUpButtonElement.classList.add("invisible");
        }
    }

    showMoveUp = () => {
        if (this.moveUpButtonElement.classList.contains("invisible")) {
            this.moveUpButtonElement.classList.remove("invisible");
        }
    }

    hideMoveDown = () => {
        if (!this.moveDownButtonElement.classList.contains("invisible")) {
            this.moveDownButtonElement.classList.add("invisible");
        }
    }

    showMoveDown = () => {
        if (this.moveDownButtonElement.classList.contains("invisible")) {
            this.moveDownButtonElement.classList.remove("invisible");
        }
    }

    scrollTo = () => {
        window.scrollTo(window.scrollX, this.contentNode.offsetTop);
    }

    render = () => {
        let contentNode = <HTMLDivElement>render(this.template, this.content);
        let element: HTMLInputElement | HTMLTextAreaElement;
        this.contentNode = contentNode;
        this.undoButtonElement = <HTMLElement>contentNode.querySelector(".undo-button");
        this.moveUpButtonElement = <HTMLElement>contentNode.querySelector(".move-up-button");
        this.moveDownButtonElement = <HTMLElement>contentNode.querySelector(".move-down-button");

        this.undoButtonElement.addEventListener("click", () => {
            this.revertChanges();
            this.master.undoContent(this);
            this.toggleUndo();
        });

        this.moveUpButtonElement.addEventListener("click", () => {
            this.master.moveContentUp(this, contentNode);
            this.toggleUndo();
        });

        this.moveDownButtonElement.addEventListener("click", () => {
            this.master.moveContentDown(this, contentNode);
            this.toggleUndo();
        });

        contentNode.querySelector(".delete-button").addEventListener("click", () => {
            this.master.deleteContent(this, contentNode);
            this.toggleUndo();
        });

        for (const key in this.content) {
            element = <HTMLInputElement | HTMLTextAreaElement>contentNode.querySelector(`[name=${key}]`);
            if (element) {
                if (element instanceof HTMLTextAreaElement) {
                    autoGrow(element);
                }
                this.contentElements[key] = element;

                this.addInputListener(contentNode, element, key);
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
                this.contentElements[key].value = this.original[key];
            }
        }
    }

    equals = (other: Content<T>) => {
        return JSON.stringify(this.content) === JSON.stringify(other.content)
    }

    getOrder = (): number => {
        return this.content.order;
    }

    setOrder = (order: number): void => {
        // @ts-ignore
        this.content.order = order;
    }

    getContent = (): T => {
        return {...this.content};
    }

    getID = (): number => {
        // @ts-ignore
        return this.content.id;
    }

    setID = (id: number) => {
        // @ts-ignore
        this.content.id = id;
    }
}

abstract class ContentManager<T> {
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

    updateOriginal = () => {
        this.originalOrder = [...this.content];
    }

    createContent = (content: T) => {
        return new Content<T>(content, this.contentTemplate, this);
    }

    getRequest = async () => {
        this.contentListElement.innerHTML = "";
        let [initialResponse, initialStatus]: [ApiGetResponse<T>, number] = await requestEndpoint(
            this.endpoint, this.token
        );
        if (200 <= initialStatus && initialStatus < 300) {
            this.content = initialResponse.results.map(result => this.createContent(result));

            if (initialResponse.next) {
                let nextURL = new URL(initialResponse.next);
                let limit = parseInt(nextURL.searchParams.get("limit"));
                let [followupResponse, followupStatus]: [ApiGetResponse<T>, number] = await requestEndpoint(
                    `${this.endpoint}?limit=${initialResponse.count - limit}&offset=${limit}`, this.token
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

    setSyncRequest = (content: Content<T>, request: Callable, force=false) => {
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

    removeSyncRequest = (content: Content<T>) => {
        if (this.syncRequests.has(content)) {
            this.syncRequests.delete(content);
        }
    }

    syncRequest = async () => {
        this.content.forEach((content, index) => {
            if (content.getOrder() !== index) {
                content.setOrder(index);
                this.setSyncRequest(content, async () => {
                    await requestEndpoint(`${this.endpoint}${content.getID()}/`, this.token, "PUT", content.getContent());
                });
            }
        });

        console.log(`requests ${this.syncRequests.size}`);
        for await (let [content, request] of this.syncRequests) {
            await request();
            content.updateOriginal();
            this.removeSyncRequest(content);
        }
        this.updateOriginal();
        this.toggleCommit();
    }

    renderContent = () => {
        for (const content of this.content) {
            this.contentListElement.appendChild(content.render());
        }
    }

    changed = (): boolean => {
        if (this.content.length === this.originalOrder.length) {
            for (let i = 0; i < this.content.length; i++) {
                if (this.content[i].changed()) {
                    console.log("1")
                    console.log(`Have changed, ${this.syncRequests.size} requests queued.`)
                    return true;
                }
                if (!this.content[i].equals(this.originalOrder[i])) {
                    console.log("2")
                    console.log(`Have changed, ${this.syncRequests.size} requests queued.`)
                    return true;
                }
                if (this.content[i].getOrder() !== i) {
                    console.log("3")
                    console.log(`Have changed, ${this.syncRequests.size} requests queued.`)
                    return true;
                }
            }
        } else {
            console.log("4")
            console.log(`Have changed, ${this.syncRequests.size} requests queued.`)
            return true;
        }
        console.log("5")
        console.log(`Have NOT changed, ${this.syncRequests.size} requests queued.`)
        return false;
    }

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

    toggleMoveButtons = () => {
        this.content.forEach(content => {
            content.showMoveUp();
            content.showMoveDown();
        })
        if (this.content.length) {
            this.content[0].hideMoveUp();
            this.content[this.content.length-1].hideMoveDown();
        }
    }

    addContent = () => {
        let content = this.createContent(this.emptyContent);
        let contentNode = content.render();
        this.content.splice(0, 0, content);
        this.contentListElement.insertBefore(contentNode, this.contentListElement.firstChild);

        this.toggleMoveButtons();
        this.toggleCommit();
        content.scrollTo();

        this.setSyncRequest(content, async () => {
            let [response, status]: [T, number] = await requestEndpoint(this.endpoint, this.token, "POST", content.getContent());
            if (200 <= status && status < 300) {
                // @ts-ignore
                content.setID(response.id);
            }
        });
        this.contentListElement.style.height = `${this.contentListElement.scrollHeight}px`;

    }

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

            this.setSyncRequest(content, async () => {
                await requestEndpoint(`${this.endpoint}${content.getID()}/`, this.token, "DELETE", content.getContent());
            }, true);
        }
        this.toggleCommit();
    }

    editContent = (content: Content<T>) => {
        if (content.changed()) {
            this.setSyncRequest(content, async () => {
                await requestEndpoint(`${this.endpoint}${content.getID()}/`, this.token, "PUT", content.getContent());
            })
        }
        this.toggleCommit();
    }

    undoContent = (content: Content<T>) => {
        this.removeSyncRequest(content);
        this.toggleCommit();
    }

    revertAllChanges = () => {
        for (const contentElement of this.content) {
            contentElement.revertChanges();
        }
    }
}

class CourseContentManager extends ContentManager<Course> {
    emptyContent = {
        id: 0,
        university: "",
        name: "",
        credit: 0,
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10),
        order: -1
    };

    static create = async (token: string, commitElement: HTMLElement): Promise<CourseContentManager> => {
        let contentTemplate = await requestTemplate("course.html");
        return new CourseContentManager(
            token, "courses/",
            contentTemplate,
            <HTMLDivElement>document.getElementById("course-list"),
            commitElement
        );
    }
}

class JobContentManager extends ContentManager<Job> {
    emptyContent = {
        id: 0,
        company: "",
        title: "",
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10),
        order: -1
    }

    static create = async (token: string, commitElement: HTMLElement): Promise<JobContentManager> => {
        let jobTemplate = await requestTemplate("job.html");
        return new JobContentManager(
            token, "jobs/", jobTemplate,
            <HTMLDivElement>document.getElementById("job-list"),
            commitElement
        );
    }
}

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
            token, "webpages/", webPageTemplate,
            <HTMLDivElement>document.getElementById("webpage-list"),
            commitElement
        );
    }
}

window.addEventListener("load", async () => {
    const addCourseElement = document.getElementById("add-course");
    const addJobElement = document.getElementById("add-job");
    const addWebPage = document.getElementById("add-webpage");

    const commitCourseChangesElement = document.getElementById("apply-courses");
    const commitJobChangesElement = document.getElementById("apply-jobs");
    const commitWebPageChangesElement = document.getElementById("apply-webpages");

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

    const token = localStorage.getItem("token");
    const courseContentManager = CourseContentManager.create(
        token, commitCourseChangesElement
    ).then(async manager => {
        await manager.getRequest();
        addCourseElement.addEventListener("click", () => {
            courseToggle.toggleOn();
            manager.addContent();
        });
        commitCourseChangesElement.addEventListener("click", async () => {
            await manager.syncRequest();
        });
        return manager;
    });

    const jobContentManager = JobContentManager.create(
        token, commitJobChangesElement
    ).then(async manager => {
        await manager.getRequest();
        addJobElement.addEventListener("click", () => {
            jobToggle.toggleOn();
            manager.addContent();
        });
        commitJobChangesElement.addEventListener("click", async () => {
            await manager.syncRequest();
        });
        return manager;
    });

    const webPageContentManager = WebPageContentManager.create(
        token, commitWebPageChangesElement
    ).then(async manager => {
        await manager.getRequest();
        addWebPage.addEventListener("click", () => {
            webPageToggle.toggleOn();
            manager.addContent();
        });
        commitWebPageChangesElement.addEventListener("click", async () => {
            await manager.syncRequest();
        });
        return manager
    });
});
