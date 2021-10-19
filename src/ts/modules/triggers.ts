export const autoGrow = (textAreaElement: HTMLTextAreaElement) => {
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
}