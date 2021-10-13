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
    private readonly original: T;
    private master: ContentManager<T>;
    private content: T;
    private contentElements: { [key: string]: HTMLInputElement | HTMLTextAreaElement };

    constructor(content: T, template: string, master: ContentManager<T>) {
        this.original = {...content};
        this.content = content;
        this.template = template;
        this.master = master;
        this.contentElements = {};
    }

    private addInputListener = (contentNode: HTMLDivElement, element: HTMLInputElement | HTMLTextAreaElement, key: string): void => {
        element.addEventListener("input", () => {
            // @ts-ignore
            this.content[key] = element.value;
            this.master.editContent(this);
        })
    }

    render = () => {
        let contentNode = <HTMLDivElement>render(this.template, this.content);
        let element: HTMLInputElement | HTMLTextAreaElement;

        contentNode.querySelector(".move-up-button").addEventListener("click", () => {
            this.master.moveContentUp(this, contentNode);
        });

        contentNode.querySelector(".move-down-button").addEventListener("click", () => {
            this.master.moveContentDown(this, contentNode);
        });

        contentNode.querySelector(".undo-button").addEventListener("click", () => {
            this.revertChanges();
            this.master.undoContent(this);
        });

        contentNode.querySelector(".delete-button").addEventListener("click", () => {
            this.master.deleteContent(this, contentNode);
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
}

abstract class ContentManager<T> {
    protected abstract emptyContent: T;

    protected readonly token: string;
    protected readonly endpoint: ApiEndpoint;
    private readonly contentTemplate: string;

    private readonly syncRequests: Map<Content<T>, Callable>;

    protected contentListElement: HTMLDivElement;
    private originalOrder: Content<T>[];
    protected content: Content<T>[];

    constructor(token: string, endpoint: ApiEndpoint, contentTemplate: string, resultListElement: HTMLDivElement) {
        this.token = token;
        this.endpoint = endpoint;
        this.contentTemplate = contentTemplate;
        this.contentListElement = resultListElement;
        this.content = [];
        this.originalOrder = [];
        this.syncRequests = new Map();
    }

    addContent = () => {
        let content = this.createContent(this.emptyContent);
        let contentNode = content.render();

        this.content.splice(0, 0, content);
        this.contentListElement.insertBefore(contentNode, this.contentListElement.firstChild);
        this.setSyncRequest(content, async () => {
            await requestEndpoint(this.endpoint, this.token, "POST", content.getContent())
        });
        this.contentListElement.style.height = `${this.contentListElement.scrollHeight}px`;
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
            this.originalOrder = [...this.content];
            this.renderContent();
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


        for await (let [, request] of this.syncRequests) {
            await request();
        }

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

    moveContentUp = (content: Content<T>, contentNode: HTMLDivElement): void => {
        let index = this.content.indexOf(content);
        if (index > 0) {
            this.content.splice(index, 1);
            this.content.splice(index - 1, 0, content);
            this.contentListElement.insertBefore(contentNode, contentNode.previousSibling);
        }
    }

    moveContentDown = (content: Content<T>, contentNode: HTMLDivElement) => {
        let index = this.content.indexOf(content);
        if (index < this.content.length) {
            this.content.splice(index, 1);
            this.content.splice(index + 1, 0, content);
            this.contentListElement.insertBefore(contentNode.nextSibling, contentNode);
        }
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
    }

    editContent = (content: Content<T>) => {
        if (content.changed()) {
            this.setSyncRequest(content, async () => {
                await requestEndpoint(`${this.endpoint}${content.getID()}/`, this.token, "PUT", content.getContent());
            })
        }
    }

    undoContent = (content: Content<T>) => {
        this.removeSyncRequest(content);
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
    emptyContent = {
        id: 0,
        company: "",
        title: "",
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10),
        order: -1
    }

    static create = async (token: string): Promise<JobContentManager> => {
        let jobTemplate = await requestTemplate("job.html");
        return new JobContentManager(
            token, "jobs/", jobTemplate,
            <HTMLDivElement>document.getElementById("job-list")
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
    const courseContentManager = CourseContentManager.create(token).then(async manager => {
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

    const jobContentManager = JobContentManager.create(token).then(async manager => {
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

    const webPageContentManager = WebPageContentManager.create(token).then(async manager => {
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

