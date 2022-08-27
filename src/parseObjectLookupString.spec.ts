import parse from './parseObjectLookupString';

describe('parseObjectLookupString', () => {
  it('parses empty path', () => {
    expect(parse()).toEqual([]);
    expect(parse('')).toEqual([]);
  });

  test('one', () => {
    expect(parse('one')).toEqual([{ key: 'one', optional: false }]);
  });

  test('?.one', () => {
    expect(parse('?.one')).toEqual([{ key: 'one', optional: true }]);
  });

  test('one.two', () => {
    expect(parse('one.two')).toEqual([
      { key: 'one', optional: false },
      { key: 'two', optional: false },
    ]);
  });

  test(' one\t.\r\ntwo. three  ', () => {
    expect(parse(' one\t.\r\ntwo. three  ')).toEqual([
      { key: 'one', optional: false },
      { key: 'two', optional: false },
      { key: 'three', optional: false },
    ]);
  });

  test('one?.two.three', () => {
    expect(parse('one?.two.three')).toEqual([
      { key: 'one', optional: false },
      { key: 'two', optional: true },
      { key: 'three', optional: false },
    ]);
  });

  test('one[2]', () => {
    expect(parse('one[2]')).toEqual([
      { key: 'one', optional: false },
      { key: 2, optional: false },
    ]);
  });

  test('[0]', () => {
    expect(parse('[0]')).toEqual([{ key: 0, optional: false }]);
  });

  test('?.[1]', () => {
    expect(parse('?.[1]')).toEqual([{ key: 1, optional: true }]);
  });

  test('one?.[2].three', () => {
    expect(parse('one?.[2].three')).toEqual([
      { key: 'one', optional: false },
      { key: 2, optional: true },
      { key: 'three', optional: false },
    ]);
  });

  test('["o?.[\'`.n\\re\\n💃"]', () => {
    expect(parse('["o?.[\'`.n\re\n💃"]')).toEqual([
      { key: "o?.['`.n\re\n💃", optional: false },
    ]);
  });

  test('["\\""]', () => {
    expect(parse('["\\""]')).toEqual([{ key: '"', optional: false }]);
  });

  test('["\\"]', () => {
    expect(parse('["\\\\"]')).toEqual([{ key: '\\', optional: false }]);
  });

  test('?.["123"].one?.[`\\``]', () => {
    expect(parse('?.["123"].one?.[`\\``]')).toEqual([
      { key: '123', optional: true },
      { key: 'one', optional: false },
      { key: '`', optional: true },
    ]);
  });

  describe('parsing errors', () => {
    test('["one"', () => {
      expect(() => parse('["one"')).toThrowErrorMatchingInlineSnapshot(
        `"Unterminated access expression"`,
      );
    });

    test('[asd]', () => {
      expect(() => parse('[asd]')).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected a"`,
      );
    });

    test('["\\"]', () => {
      expect(() => parse('["\\"]')).toThrowErrorMatchingInlineSnapshot(
        `"Unterminated string"`,
      );
    });

    test('6', () => {
      expect(() => parse('6')).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected 6"`,
      );
    });

    test('one.6', () => {
      expect(() => parse('one.6')).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected 6"`,
      );
    });

    test('"ney"', () => {
      expect(() => parse('"ney"')).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected \\""`,
      );
    });
  });

  describe('custom escape', () => {
    it('requires one single escape char', () => {
      expect(() =>
        parse('', { escape: '--' }),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Escape char must have length 1, got 2"`,
      );

      expect(() =>
        parse('', { escape: '' }),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Escape char must have length 1, got 0"`,
      );
    });

    test('["-""]', () => {
      expect(parse('["-""]', { escape: '-' })).toEqual([
        { key: '"', optional: false },
      ]);
    });

    test('["--"]', () => {
      expect(parse('["--"]', { escape: '-' })).toEqual([
        { key: '-', optional: false },
      ]);
    });

    test('["- "]', () => {
      expect(parse('["- "]', { escape: '-' })).toEqual([
        { key: '- ', optional: false },
      ]);
    });

    describe('parsing errors', () => {
      test('["-"]', () => {
        expect(() =>
          parse('["-"]', { escape: '-' }),
        ).toThrowErrorMatchingInlineSnapshot(`"Unterminated string"`);
      });
    });
  });
});
