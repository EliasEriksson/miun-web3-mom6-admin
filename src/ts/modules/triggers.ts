/**
 * makes the given textAreaElement responsive in height and avoids the scrollbar
 * @param textAreaElement
 */
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
    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            resize();
        }
    });
    observer.observe(textAreaElement);
}