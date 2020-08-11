export const tokenize = function (s: string | undefined): string[] {
    return (
        s?.match(/"(\\"|[^"])*"|'(\\'|[^'])*'|`.*`|(\\ |\S)+/g) || []
    ).map(token =>
        token.match(/"(\\"|[^"])*"|'(\\'|[^'])*'/)
        && eval(token)
        || token
    )
}