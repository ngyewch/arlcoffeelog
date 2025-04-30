import ky from 'ky';

export interface User {
    username: string;
}

const baseUrl = 'https://script.google.com/macros/s/AKfycbym-ODmhPDbYIfd0oSaD2FYdtZCbpNyPWctBOQmu3C-_LbJQADixgXg-So8foXMXdSR/exec';

export function getUsers(): Promise<User[]> {
    return ky.get(makeUrl({action: 'getUsers'}))
        .then(rsp => rsp.json())
        .then(rsp => {
            return rsp as User[];
        });
}

export function getTotalCoffee(username: string): Promise<number> {
    return ky.get(makeUrl({action: 'getTotalCoffee', username: username}))
        .then(rsp => rsp.json())
        .then(rsp => {
            return rsp as number;
        });
}

function makeUrl(params: Record<string, string>): string {
    const urlSearchParams = new URLSearchParams(params);
    return `${baseUrl}?${urlSearchParams.toString()}`;
}
