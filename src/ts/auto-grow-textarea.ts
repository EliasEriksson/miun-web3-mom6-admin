// class AutoGrowTextarea {
//     private readonly extra: number;
//     private readonly init: number;
//     private textArea: HTMLTextAreaElement;
//
//     constructor(textAreaElement: HTMLTextAreaElement) {
//         this.extra = textAreaElement.offsetHeight - textAreaElement.clientHeight;
//         this.init = textAreaElement.offsetHeight;
//         this.textArea = textAreaElement
//
//         this.textArea.addEventListener("input", this.resize);
//         window.addEventListener("resize", this.resize);
//     }
//
//     resize = () => {
//         console.log("triggered")
//         this.textArea.style.height = `${this.init}px`;
//         let height = Math.max(
//             this.init, (this.textArea.scrollHeight + this.extra)
//         );
//         this.textArea.style.height = `${height}px`;
//     }
// }


// window.addEventListener("load", () => {
//     let textAreas = document.getElementsByClassName("auto-grow");
//     let autoGrowTextAreas = Array.from(textAreas).map(
//         (textAreaElement: HTMLTextAreaElement) => {
//             return new AutoGrowTextarea(textAreaElement);
//         }
//     );
// })
