export const apiURL = new URL("https://web3mom6rest.eliaseriksson.eu/");

export const translate = {

}


export type ApiGetResponse<T> = {
    count: number,
    next: string|null,
    previous: string|null,
    results: T[]
}


export type RequestMethods = "GET" | "POST" | "PUT" | "DELETE";

export type Course = {
    "id": number,
    university: string,
    name: string,
    credit: number,
    startDate: Date,
    endDate: Date
} & {[key: string]: string};

export type Job = {
    id: number,
    company: string,
    title: string,
    startDate: Date,
    endDate: Date
} & {[key: string]: string};

export type WebPage = {
    id: number,
    title: string,
    description: string,
    url: string
} & {[key: string]: string};

export type ContentType = Course|Job|WebPage;


export const _ = "";

export type Callable = (...any) => any;