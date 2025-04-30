import ky from 'ky';
import {format} from 'date-fns';

export interface User {
    username: string;
}

const baseUrl = 'https://script.google.com/macros/s/AKfycbym-ODmhPDbYIfd0oSaD2FYdtZCbpNyPWctBOQmu3C-_LbJQADixgXg-So8foXMXdSR/exec';

export async function getUsers(): Promise<User[]> {
    return ky.get(makeUrl({
        action: 'getUsers',
    }))
        .then(rsp => rsp.json())
        .then(rsp => rsp as User[]);
}

export async function getTotalCoffee(username: string): Promise<number> {
    return ky.get(makeUrl({
        action: 'getTotalCoffee',
        username: username,
    }))
        .then(rsp => rsp.json())
        .then(rsp => rsp as number);
}

export async function logCoffee(username: string, date: Date, coffeeCount: number): Promise<string> {
    return ky.post(makeUrl({
        action: 'logCoffee',
        username: username,
        date: format(date, 'yyyy-MM-dd h:mm:ss aa'),
        coffeeCount: coffeeCount.toString(),
    }))
        .then(rsp => rsp.text());
}

export async function resetUserData(username: string): Promise<string> {
    return ky.post(makeUrl({
        action: 'resetUserData',
        username: username,
    }))
        .then(rsp => rsp.text());
}

function makeUrl(params: Record<string, string>): string {
    const urlSearchParams = new URLSearchParams(params);
    return `${baseUrl}?${urlSearchParams.toString()}`;
}
