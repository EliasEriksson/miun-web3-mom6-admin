export const autoGrow = (textAreaElement: HTMLTextAreaElement, master: HTMLElement) => {
    const extra = textAreaElement.offsetHeight - textAreaElement.clientHeight;
    const init = textAreaElement.offsetHeight;

    
    const resize = () => {
        textAreaElement.style.height = `${init}px`;
        let height = Math.max(
            init, (textAreaElement.scrollHeight + extra)
        );
        textAreaElement.style.height = `${height}px`;
    }

    textAreaElement.addEventListener("input", resize);
    window.addEventListener("resize", resize);
    master.addEventListener("resize", resize);
}