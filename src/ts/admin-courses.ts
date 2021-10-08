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



window.addEventListener("load", () => {


    let addCourseElement = document.getElementById("add-course");
    let courseToggle = new Toggle(
        document.getElementById("course-expand-button"),
        document.getElementById("course-list")
    );
    addCourseElement.addEventListener("click", courseToggle.toggleOn);

});


