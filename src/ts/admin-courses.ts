import {requestEndpoint, requestTemplate} from "./modules/requests.js";
import {ApiGetResponse, Course, Job, WebPage} from "./modules/constants.js";
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

    private addInputListener = (element: HTMLInputElement | HTMLTextAreaElement, key: string): void => {
        element.addEventListener("input", () => {
            // @ts-ignore
            this.content[key] = element.value;
            this.master.changed();
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
            console.log("pls revert")
            this.revertChanges();
        });

        contentNode.querySelector(".delete-button").addEventListener("click", () => {
            this.master.deleteContent(this, contentNode);
        });

        for (const contentKey in this.content) {
            element = <HTMLInputElement | HTMLTextAreaElement>contentNode.querySelector(`[name=${contentKey}]`);


            if (element) {
                if (element instanceof HTMLTextAreaElement) {
                    autoGrow(element);
                }
                this.contentElements[contentKey] = element;
                this.addInputListener(element, contentKey);
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
}

abstract class ContentManager<T> {
    private readonly token: string;
    private readonly endpoint: string;
    private readonly contentTemplate: string;

    protected contentListElement: HTMLDivElement;
    private originalOrder: Content<T>[];
    protected content: Content<T>[];

    constructor(token: string, endpoint: string, contentTemplate: string, resultListElement: HTMLDivElement) {
        this.token = token;
        this.endpoint = endpoint;
        this.contentTemplate = contentTemplate;
        this.contentListElement = resultListElement;
        this.content = [];
        this.originalOrder = [];
    }

    public abstract addContent(): void;

    createContent = (content: T) => {
        return new Content<T>(content, this.contentTemplate, this);
    }

    getRequest = async () => {
        this.contentListElement.innerHTML = "";
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
            this.originalOrder = [...this.content];
            this.renderContent();
        }
    }

    syncRequest = async () => {

    }

    renderContent = () => {
        for (const contentElement of this.content) {
            this.contentListElement.appendChild(contentElement.render());
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

            let newHeight: number;
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
        }
    }

    undoContent = (content: Content<T>) => {
        console.log("undo")
    }

    revertAllChanges = () => {
        for (const contentElement of this.content) {
            contentElement.revertChanges();
        }
    }
}

class CourseContentManager extends ContentManager<Course> {
    public addContent(): void {
        let date = new Date().toISOString().substring(0, 10);
        let content = this.createContent({
            id: 0,
            university: "",
            name: "",
            credit: 0,
            startDate: date,
            endDate: date,
            order: -1
        });
        let contentNode = content.render();
        this.content.splice(0, 0, content);
        this.contentListElement.insertBefore(contentNode, this.contentListElement.firstChild);
        console.log(this.content)
    }

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
    public addContent(): void {
        let date = new Date().toISOString().substring(0, 10);
        let content = this.createContent({
            id: 0,
            company: "",
            title: "",
            startDate: date,
            endDate: date,
            order: -1
        });
        let contentNode = content.render();
        this.content.splice(0, 0, content);
        this.contentListElement.insertBefore(contentNode, this.contentListElement.firstChild);
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
    public addContent(): void {
        let content = this.createContent({
            id: 0,
            title: "",
            description: "",
            url: "",
            order: -1
        });
        let contentNode = content.render();
        this.content.splice(0, 0, content);
        this.contentListElement.insertBefore(contentNode, this.contentListElement.firstChild);
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

    const token = localStorage.getItem("token");
    let [courseContentManager, jobContentManager, webPageContentManager] = (await Promise.allSettled(
        [
            CourseContentManager.create(token).then(async manager => {
                await manager.getRequest();
                return manager;
            }).then(manager => manager),

            JobContentManager.create(token).then(async manager => {
                await manager.getRequest()
                return manager;
            }).then(manager => manager),

            WebPageContentManager.create(token).then(async manager => {
                await manager.getRequest();
                return manager
            }).then(manager => manager)
        ]
    )).map(result => {
        if (result.status === "fulfilled") {
            return result.value;
        }
    })

    addCourseElement.addEventListener("click", () => {
        courseToggle.toggleOn();
        courseContentManager.addContent();
    });
    addJobElement.addEventListener("click", () => {
        jobToggle.toggleOn();
        jobContentManager.addContent();
    });
    addWebPage.addEventListener("click", () => {
        webPageToggle.toggleOn();
        webPageContentManager.addContent();
    });
});


