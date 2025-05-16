/* eslint-disable prettier/prettier */
export class UsernameAlreadyExistsError extends Error {
    constructor() {
        super('Username already exists');
    }
}
export class EmailAlreadyExistsError extends Error {
    constructor() {
        super('Email already exists');
    }
}


export enum RegisterErrors {
    UsernameAlreadyExists = 'USERNAME_ALREADY_EXISTS',
    EmailAlreadyExists = 'EMAIL_ALREADY_EXISTS',
}