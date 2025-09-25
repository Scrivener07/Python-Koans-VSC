export class Markup {


    public static escapeHtml(text: string): string {
        return text.replace(/[&<>"']/g, (markup) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[markup] as string));
    }


}
