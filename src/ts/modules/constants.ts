export const apiURL = new URL("https://web3mom6rest.eliaseriksson.io/");

export const translateCourse = {
    courses: {
        id: "ID",
        university: "Universitet",
        name: "Kursnamn",
        credit: "Högskolepoäng",
        startDate: "Start datum",
        endDate: "Slut datum",
        order: "Ordning",
    },
    jobs: {
        id: "ID",
        company: "Företag",
        title: "Titel",
        startDate: "Start datum",
        endDate: "Slut Datum",
        order: "Ordning"
    },
    webpages: {
        id: "ID",
        title: "Titel",
        description: "Beskrivning",
        url: "Url",
        order: "Ordning"
    }



}

export type ApiGetResponse<T> = {
    count: number,
    next: string|null,
    previous: string|null,
    results: T[]
}


export type RequestMethods = "GET" | "POST" | "PUT" | "DELETE";

export type Course = {
    id: number,
    university: string,
    name: string,
    credit: number,
    startDate: string,
    endDate: string,
    order: number
}

export type Job = {
    id: number,
    company: string,
    title: string,
    startDate: string,
    endDate: string,
    order: number
}

export type WebPage = {
    id: number,
    title: string,
    description: string,
    url: string,
    order: number
}

export type ContentType = Course|Job|WebPage;

export type CourseErrors = {
    id: string[],
    university: string[],
    name: string[],
    credit: string[],
    startDate: string[],
    endDate: string[],
    order: string[]
}

export type JobErrors = {
    id: string[],
    company: string[],
    title: string[],
    startDate: string[],
    endDate: string[],
    order: string[]
}

export type WebPageErrors = {
    id: string[],
    title: string[],
    description: string[],
    url: string[],
    order: string[]
}

export type ContentErrors = CourseErrors | JobErrors | WebPageErrors;

export type ApiEndpoint = "courses" | "jobs" | "webpages";

export const _ = ""; // cause sometimes typescript compiles stuff badly

export type Callable = (...any: any) => any;