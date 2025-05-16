/* eslint-disable prettier/prettier */
export class MissingEnvironmentVariableError extends Error {
    constructor(variableName: string) {
        super(`Missing environment variable: ${variableName}`);
    }
}
