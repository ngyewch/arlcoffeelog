export interface AppConfig {
    title: string;
    netlifySiteId: string;
    allowedOrg: string;
    unitPrice: number;
    payeePhoneNumber: any;
    payeeName: string;
    paymentComments: string;
}

export const appConfig: AppConfig = {
    title: 'ARL Productivity Logger',
    netlifySiteId: '154a9f66-7459-4468-bae8-1f43798c1334',
    allowedOrg: 'org-arl',
    unitPrice: 0.60,
    payeePhoneNumber: '+6581982143',
    payeeName: 'Kee',
    paymentComments: 'ARL Coffee',
};
