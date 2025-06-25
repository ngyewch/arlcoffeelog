export interface UserMapping {
    username: string;
    githubLogin: string;
}

export const guestUserIds: string[] = [
    "wy-95",
];

export const existingUsers: UserMapping[] = [
    {
        username: "bharath",
        githubLogin: "bharathkalyan",
    },
    {
        username: "hari",
        githubLogin: "harivnkochi",
    },
    {
        username: "kee",
        githubLogin: "AlexK2008",
    },
    {
        username: "kexin",
        githubLogin: "Kexin1",
    },
    {
        username: "luyuan",
        githubLogin: "LuyuanPeng",
    },
    {
        username: "mandar",
        githubLogin: "mchitre",
    },
    {
        username: "nick",
        githubLogin: "ngyewch",
    },
    {
        username: "rajat",
        githubLogin: "rajmis",
    },
    {
        username: "Shuangshuang",
        githubLogin: "shuangshuang621",
    },
    {
        username: "simen",
        githubLogin: "simhex",
    },
    {
        username: "too",
        githubLogin: "ymtoo",
    },
];

export function findExistingUser(githubLogin: string): UserMapping | undefined {
    return existingUsers.find((existingUser) => existingUser.githubLogin.toLowerCase() === githubLogin.toLowerCase());
}
