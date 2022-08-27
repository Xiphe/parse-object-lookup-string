import CodeFrameError from 'code-frame-error';

export interface Lookup {
  key: string | number;
  optional: boolean;
}

type Context = {
  path: Lookup[];
  token?: string | number;
  column: number;
  line: number;
  state?: State;
  optional: boolean;
};

type StateOptional = {
  parent?: State;
  type: 'optional';
};

type StateAccess = {
  parent?: State;
  with: 'string' | 'number';
  type: 'access expression';
};

type StateDot = {
  parent?: State;
  type: 'dot';
};

type StateString = {
  type: 'string';
  parent?: State;
  value: string;
  kind: '"' | "'" | '`';
};
type StateEscape = {
  parent: StateString;
  type: 'escape';
};

type State = StateOptional | StateAccess | StateString | StateDot | StateEscape;

export interface Options {
  escape?: string;
}

export function parseObjectLookupString(
  path?: string,
  { escape = '\\' }: Options = {},
): Lookup[] {
  if (escape.length !== 1) {
    throw new Error(`Escape char must have length 1, got ${escape.length}`);
  }
  if (!path?.trim()) {
    return [];
  }

  const ctx = path.split('').reduce(
    (ctx, char) => {
      if (ctx.state?.type === 'escape') {
        if (char === escape || char === ctx.state.parent.kind) {
          ctx.state.parent.value += char;
          ctx.state = ctx.state.parent;
          return ctx;
        } else {
          ctx.state.parent.value += escape;
          ctx.state = ctx.state.parent;
        }
      }

      if (char.match(/\r/) && ctx.state?.type !== 'string') {
        return ctx;
      }
      ctx.column += 1;
      if (char.match(/\n/)) {
        ctx.line += 1;
        ctx.column = 1;
        if (ctx.state?.type !== 'string') {
          return ctx;
        }
      }
      if (char.match(/\s/) && ctx.state?.type !== 'string') {
        return ctx;
      }

      if (ctx.state?.type === 'string') {
        if (char === escape) {
          ctx.state = { type: 'escape', parent: ctx.state };
          return ctx;
        }

        if (char === ctx.state.kind) {
          ctx.token = ctx.state.value;
          ctx.state = ctx.state.parent;
        } else {
          ctx.state.value += char;
        }
        return ctx;
      }

      if (ctx.state?.type === 'dot') {
        ctx.state = ctx.state.parent;
        push(ctx);
      }

      if (ctx.state?.type === 'access expression') {
        if (char.match(/[0-9]/)) {
          ctx.token = (ctx.token || '') + char;
          return ctx;
        }

        if (!ctx.token && isStringDelimiter(char)) {
          ctx.state.with = 'string';
          ctx.state = {
            type: 'string',
            parent: ctx.state,
            value: '',
            kind: char,
          };

          return ctx;
        }

        if (ctx.token && char === ']') {
          if (ctx.state.with === 'number') {
            ctx.token = parseInt(ctx.token as string, 10);
          }
          push(ctx);
          return ctx;
        }

        throw new CodeFrameError(`Unexpected ${char}`, {
          rawLines: path,
          location: { start: { column: ctx.column, line: ctx.line } },
        });
      }

      if (char === '?') {
        ctx.state = { type: 'optional', parent: ctx.state };
        return ctx;
      }

      if (char === '.') {
        ctx.state = { type: 'dot', parent: ctx.state };
        return ctx;
      }

      if (char === '[') {
        if (ctx.token !== undefined) {
          push(ctx);
        }
        ctx.state = {
          type: 'access expression',
          parent: ctx.state,
          with: 'number',
        };
        return ctx;
      }

      if (!ctx.token && char.match(/[a-zA-Z_$]/)) {
        ctx.token = char;
        return ctx;
      }

      if (typeof ctx.token === 'string' && char.match(/[\w_$]/)) {
        ctx.token += char;
        return ctx;
      }

      throw new CodeFrameError(`Unexpected ${char}`, {
        rawLines: path,
        location: { start: { column: ctx.column, line: ctx.line } },
      });
    },
    {
      path: [],
      column: 1,
      line: 1,
      optional: false,
    } as Context,
  );

  if (ctx.state) {
    throw new CodeFrameError(`Unterminated ${ctx.state.type}`, {
      rawLines: path,
      location: { start: { column: ctx.column, line: ctx.line } },
    });
  }
  push(ctx);
  return ctx.path;
}

function push(ctx: Context) {
  if (ctx.token !== undefined) {
    ctx.path.push({
      key: ctx.token,
      optional: ctx.optional,
    });
  }
  ctx.optional = ctx.state?.type === 'optional';
  ctx.state = ctx.state?.parent;
  ctx.token = undefined;
}

function isStringDelimiter(char: string): char is '"' | '`' | '"' {
  return ["'", '"', '`'].includes(char);
}

export default parseObjectLookupString;
