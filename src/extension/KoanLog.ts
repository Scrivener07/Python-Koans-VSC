import * as vscode from 'vscode';

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
}

// A singleton logger for this extension.
export class KoanLog {
    private static readonly CHANNEL_NAME: string = 'Python Koan'

    private static instance: KoanLog | undefined;

    private readonly extensionUri: vscode.Uri
    private readonly logger: vscode.LogOutputChannel;


    constructor(extensionUri: vscode.Uri) {
        if (KoanLog.instance) {
            throw new Error('A logger instance was already created.');
        }

        this.extensionUri = extensionUri;
        this.logger = vscode.window.createOutputChannel(KoanLog.CHANNEL_NAME, {
            log: true,
        });
        KoanLog.instance = this;
        KoanLog.info([this.constructor], `Constructor`);
    }


    public static create(extensionUri: vscode.Uri): void {
        if (!KoanLog.instance) {
            KoanLog.instance = new KoanLog(extensionUri);
        }
    }


    public static debug(site: any[] = [], ...args: any[]): void {
        this.log(site, LogLevel.DEBUG, ...args);
    }


    public static info(site: any[] = [], ...args: any[]): void {
        this.log(site, LogLevel.INFO, ...args);
    }


    public static warn(site: any[] = [], ...args: any[]): void {
        this.log(site, LogLevel.WARN, ...args);
    }


    public static error(site: any[] = [], ...args: any[]): void {
        this.log(site, LogLevel.ERROR, ...args);
    }


    public static log(site: any[] = [], level: LogLevel = LogLevel.INFO, ...args: any[]): void {
        let prefix: string = KoanLog.toPrefix(site);
        if (!KoanLog.instance) {
            console.log('[KoanLog not initialized]', prefix, ...args);
            return;
        }
        const message = `${prefix} ${args.join(' ')}`;
        KoanLog.instance.logger[level](message);
    }


    private static toPrefix(site: any[] = []): string {
        let prefix: string = '';
        if (site) {
            prefix += '[';
            for (let index = 0; index < site.length; index++) {
                const element: any = site[index];
                if (index == 0) {
                    prefix += element.name;
                }
                else {
                    prefix += '.' + element.name;
                }
            }
            prefix += ']';
        }
        return prefix;
    }


    public static show(): void {
        if (!KoanLog.instance) {
            throw new Error('Logger instance was not created yet.');
        }
        KoanLog.instance.logger.show();
    }


}
