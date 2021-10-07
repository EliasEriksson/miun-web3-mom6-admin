export const apiURL = new URL("http://web3mom6rest.eliaseriksson.eu/");

export type RequestMethods = "GET" | "POST" | "PUT" | "DELETE";

export type Course = {
    "id": number,
    university: string,
    name: string,
    credit: number,
    startDate: Date,
    endDate: Date
}

export type Job = {
    id: number,
    company: string,
    title: string,
    startDate: Date,
    endDate: Date
}

export type WebPage = {
    id: number,
    title: string,
    description: string,
    url: string
}

export const _ = "";