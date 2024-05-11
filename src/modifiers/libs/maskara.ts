export interface Token {
    pattern?: RegExp;
    _default?: string;
    optional?: boolean;
    recursive?: boolean;
    transform?: (character: string) => string;
    escape?: boolean;
}

const tokens: Record<string | number, Token> = {
    0: { pattern: /\d/, _default: '0' },
    '#': { pattern: /\d/, optional: true, recursive: true },
    A: { pattern: /[a-zA-Z0-9]/ },
    S: { pattern: /.*/ },
    U: {
        pattern: /[a-zA-Z]/,
        transform: function (c: string) {
            return c.toLocaleUpperCase();
        },
    },
    L: {
        pattern: /[a-zA-Z]/,
        transform: function (c: string) {
            return c.toLocaleLowerCase();
        },
    },
    '*': {
        pattern: /.*/,
        transform: function () {
            return '*';
        },
    },
    $: { escape: true },
};

function isEscaped(pattern: string, pos: number) {
    let count = 0;
    let i = pos - 1;
    let token: Token = { escape: true };
    while (i >= 0 && token?.escape) {
        token = tokens[pattern.charAt(i)];
        count += token?.escape ? 1 : 0;
        i--;
    }
    return count > 0 && count % 2 === 1;
}

function calcOptionalNumbersToUse(pattern: string, value: string) {
    const numbersInP = pattern.replaceAll(/[^0]/g, '').length;
    const numbersInV = value.replaceAll(/[^\d]/g, '').length;
    return numbersInV - numbersInP;
}

function concatChar(text: string, character: string, options: MaskaraOptions, token?: Token) {
    if (token && typeof token.transform === 'function') {
        character = token.transform(character);
    }
    if (options.reverse) {
        return character + text;
    }
    return text + character;
}

function hasMoreTokens(pattern: string, pos: number, inc: number): boolean {
    const pc = pattern.charAt(pos);
    const token = tokens[pc];
    if (pc === '') {
        return false;
    }
    return token && !token.escape ? true : hasMoreTokens(pattern, pos + inc, inc);
}

function hasMoreRecursiveTokens(pattern: string, pos: number, inc: number): boolean {
    const pc = pattern.charAt(pos);
    const token = tokens[pc];
    if (pc === '') {
        return false;
    }
    return token?.recursive ? true : hasMoreRecursiveTokens(pattern, pos + inc, inc);
}

function insertChar(text: string, char: string, position: number) {
    const t = text.split('');
    t.splice(position, 0, char);
    return t.join('');
}

export interface MaskaraOptions {
    reverse?: boolean;
    useDefaults?: boolean;
}

export type ProcessableValue = string | null | undefined;

class Maskara {
    options: MaskaraOptions;
    pattern: string;

    constructor(pattern: string, opt?: MaskaraOptions) {
        this.options = opt || {};
        this.options = {
            reverse: this.options.reverse || false,
            useDefaults: this.options.useDefaults || this.options.reverse,
        };
        this.pattern = pattern;
    }

    process(value: ProcessableValue) {
        if (!value) {
            return { result: '', valid: false };
        }
        value = value + '';
        let pattern2 = this.pattern;
        let valid = true;
        let formatted = '';
        let valuePos = this.options.reverse ? value.length - 1 : 0;
        let patternPos = 0;
        let optionalNumbersToUse = calcOptionalNumbersToUse(pattern2, value);
        let escapeNext = false;
        const recursive: string[] = [];
        let inRecursiveMode = false;

        const steps = {
            start: this.options.reverse ? pattern2.length - 1 : 0,
            end: this.options.reverse ? -1 : pattern2.length,
            inc: this.options.reverse ? -1 : 1,
        };

        function continueCondition(options: MaskaraOptions) {
            if (
                !inRecursiveMode &&
                !recursive.length &&
                hasMoreTokens(pattern2, patternPos, steps.inc)
            ) {
                return true;
            } else if (
                !inRecursiveMode &&
                recursive.length &&
                hasMoreRecursiveTokens(pattern2, patternPos, steps.inc)
            ) {
                return true;
            } else if (!inRecursiveMode) {
                inRecursiveMode = recursive.length > 0;
            }

            if (inRecursiveMode) {
                const pc = recursive.shift();
                if (pc) {
                    recursive.push(pc);
                    if (options.reverse && valuePos >= 0) {
                        patternPos++;
                        pattern2 = insertChar(pattern2, pc, patternPos);
                        return true;
                    } else if (!options.reverse && valuePos < value.length) {
                        pattern2 = insertChar(pattern2, pc, patternPos);
                        return true;
                    }
                }
            }
            return patternPos < pattern2.length && patternPos >= 0;
        }

        for (
            patternPos = steps.start;
            continueCondition(this.options);
            patternPos = patternPos + steps.inc
        ) {
            const vc = value.charAt(valuePos);
            const pc = pattern2.charAt(patternPos);

            let token: Token | undefined = tokens[pc];
            if (recursive.length && token && !token.recursive) {
                token = undefined;
            }

            if (!inRecursiveMode || vc) {
                if (this.options.reverse && isEscaped(pattern2, patternPos)) {
                    formatted = concatChar(formatted, pc, this.options, token);
                    patternPos = patternPos + steps.inc;
                    continue;
                } else if (!this.options.reverse && escapeNext) {
                    formatted = concatChar(formatted, pc, this.options, token);
                    escapeNext = false;
                    continue;
                } else if (!this.options.reverse && token?.escape) {
                    escapeNext = true;
                    continue;
                }
            }

            if (!inRecursiveMode && token?.recursive) {
                recursive.push(pc);
            } else if (inRecursiveMode && !vc) {
                formatted = concatChar(formatted, pc, this.options, token);
                continue;
            } else if (!inRecursiveMode && recursive.length > 0 && !vc) {
                continue;
            }

            if (!token) {
                formatted = concatChar(formatted, pc, this.options, token);
                if (!inRecursiveMode && recursive.length) {
                    recursive.push(pc);
                }
            } else if (token.optional) {
                if (token.pattern?.test(vc) && optionalNumbersToUse) {
                    formatted = concatChar(formatted, vc, this.options, token);
                    valuePos = valuePos + steps.inc;
                    optionalNumbersToUse--;
                } else if (recursive.length > 0 && vc) {
                    valid = false;
                    break;
                }
            } else if (token.pattern?.test(vc)) {
                formatted = concatChar(formatted, vc, this.options, token);
                valuePos = valuePos + steps.inc;
            } else if (!vc && token._default && this.options.useDefaults) {
                formatted = concatChar(formatted, token._default, this.options, token);
            } else {
                valid = false;
                break;
            }
        }

        return { result: formatted, valid: valid };
    }

    apply(value: ProcessableValue) {
        return this.process(value).result;
    }

    validate(value: ProcessableValue) {
        return this.process(value).valid;
    }

    static process(value: ProcessableValue, pattern: string, options?: MaskaraOptions) {
        return new Maskara(pattern, options).process(value);
    }

    static apply(value: ProcessableValue, pattern: string, options?: MaskaraOptions) {
        return new Maskara(pattern, options).apply(value);
    }

    static validate(value: ProcessableValue, pattern: string, options?: MaskaraOptions) {
        return new Maskara(pattern, options).validate(value);
    }
}

export default Maskara;
