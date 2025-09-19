export class HtmlUtility {

    public static wrapDivision(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

}
