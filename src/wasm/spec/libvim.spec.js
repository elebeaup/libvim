var createModule = require('../../libvim.js');

const NORMAL = 0x01; /* Insert mode */
const INSERT = 0x10; /* Insert mode */

let vimClient;

const vimBufferGetCurrentLine = (cursorLine = vimClient.vimCursorGetLine()) => {
  const curBuf = vimClient.vimBufferGetCurrent();
  return vimClient.vimBufferGetLine(curBuf, cursorLine);
};

const bufferUpdateCallback = jasmine.createSpy();

beforeAll(async () => {
  m = await createModule();
  vimClient = m.VIM.runtime();
  vimClient.vimInit({
    bufferUpdateCallback,
  });
});

describe('insert_mode', () => {
  beforeEach(() => {
    vimClient.vimKey('<Esc>');
    vimClient.vimExecute(':1,$d');
  });

  it('should return INSERT mode', () => {
    vimClient.vimInput('I');
    expect(vimClient.vimGetMode() & INSERT).toBe(INSERT);
  });

  it('should return the curent line', () => {
    vimClient.vimInput('I');
    vimClient.vimInput('a');
    vimClient.vimInput('b');
    vimClient.vimInput('c');
    cursorLine = vimClient.vimCursorGetLine();
    expect(cursorLine).toBe(1);
    expect(vimBufferGetCurrentLine(cursorLine)).toBe('abc');
  });
});

describe('input', () => {
  beforeEach(() => {
    vimClient.vimKey('<Esc>');
    vimClient.vimExecute(':1,$d');
    vimClient.vimInput('I');
    vimClient.vimInput('a');
    vimClient.vimInput('b');
    vimClient.vimInput('c');
    vimClient.vimKey('<ENTER>');
    vimClient.vimInput('f');
    vimClient.vimInput('g');
    vimClient.vimInput('h');
    vimClient.vimKey('<Esc>');
    vimClient.vimKey('g');
    vimClient.vimKey('g');
  });

  it('should move with arrow keys', () => {
    expect(vimBufferGetCurrentLine()).toBe('abc');
    expect(vimClient.vimCursorGetLine()).toBe(1);
    expect(vimClient.vimCursorGetColumn()).toBe(0);
    expect(vimClient.vimCursorGetPosition()).toEqual({
      lineNumber: 1,
      columnNumber: 0,
      extraVirtualColumn: 0,
    });

    vimClient.vimKey('<Right>');
    expect(vimClient.vimCursorGetLine()).toBe(1);
    expect(vimClient.vimCursorGetColumn()).toBe(1);
    expect(vimClient.vimCursorGetPosition()).toEqual({
      lineNumber: 1,
      columnNumber: 1,
      extraVirtualColumn: 0,
    });

    vimClient.vimKey('<Down>');
    expect(vimClient.vimCursorGetLine()).toBe(2);
    expect(vimClient.vimCursorGetColumn()).toBe(1);
    expect(vimClient.vimCursorGetPosition()).toEqual({
      lineNumber: 2,
      columnNumber: 1,
      extraVirtualColumn: 0,
    });

    vimClient.vimKey('<Left>');
    expect(vimClient.vimCursorGetLine()).toBe(2);
    expect(vimClient.vimCursorGetColumn()).toBe(0);
    expect(vimClient.vimCursorGetPosition()).toEqual({
      lineNumber: 2,
      columnNumber: 0,
      extraVirtualColumn: 0,
    });

    vimClient.vimKey('<Up>');
    expect(vimClient.vimCursorGetLine()).toBe(1);
    expect(vimClient.vimCursorGetColumn()).toBe(0);
    expect(vimClient.vimCursorGetPosition()).toEqual({
      lineNumber: 1,
      columnNumber: 0,
      extraVirtualColumn: 0,
    });
  });
});

describe('buffer_update', () => {
  beforeEach(() => {
    vimClient.vimKey('<Esc>');
    vimClient.vimExecute(':1,$d');
    vimClient.vimInput('I');
    vimClient.vimInput('a');
    vimClient.vimInput('b');
    vimClient.vimInput('c');
    vimClient.vimKey('<Esc>');
    bufferUpdateCallback.calls.reset();
  });

  it('should single update', () => {
    expect(vimClient.vimCursorGetPosition()).toEqual({
      lineNumber: 1,
      columnNumber: 2,
      extraVirtualColumn: 0,
    });

    vimClient.vimInput('x');

    expect(vimClient.vimCursorGetPosition()).toEqual({
      lineNumber: 1,
      columnNumber: 1,
      extraVirtualColumn: 0,
    });
    expect(vimBufferGetCurrentLine()).toBe('ab');
    expect(bufferUpdateCallback).toHaveBeenCalledWith({
      firstLineNumber: 1,
      lastLineNumber: 2,
      numberExtraLines: 0,
    });
  });

  it('should add line', () => {
    vimClient.vimInput('y');
    vimClient.vimInput('y');
    vimClient.vimInput('p');
    expect(vimBufferGetCurrentLine()).toBe('abc');
    expect(bufferUpdateCallback).toHaveBeenCalledWith({
      firstLineNumber: 2,
      lastLineNumber: 2,
      numberExtraLines: 1,
    });
  });

  it('should delete line', () => {
    vimClient.vimInput('d');
    vimClient.vimInput('d');
    expect(vimBufferGetCurrentLine()).toBe('');
    expect(bufferUpdateCallback).toHaveBeenCalledWith({
      firstLineNumber: 1,
      lastLineNumber: 2,
      numberExtraLines: -1,
    });
  });
});

describe('cursor', () => {
  beforeEach(() => {
    vimClient.vimKey('<Esc>');
    vimClient.vimExecute(':1,$d');
    vimClient.vimInput('I');
    vimClient.vimInput('a');
    vimClient.vimInput('b');
    vimClient.vimInput('c');
    vimClient.vimKey('<Esc>');
    vimClient.vimInput('yyp');
  });

  it('should set cursor', () => {
    vimClient.vimInput('G$');

    expect(vimClient.vimCursorGetPosition()).toEqual({
      lineNumber: 2,
      columnNumber: 2,
      extraVirtualColumn: 0,
    });

    vimClient.vimCursorSetPosition({
      lineNumber: 1,
      columnNumber: 0,
    });
    expect(vimClient.vimCursorGetPosition()).toEqual({
      lineNumber: 1,
      columnNumber: 0,
      extraVirtualColumn: 0,
    });

    vimClient.vimCursorSetPosition({
      lineNumber: 2,
      columnNumber: 2,
    });
    expect(vimClient.vimCursorGetPosition()).toEqual({
      lineNumber: 2,
      columnNumber: 2,
      extraVirtualColumn: 0,
    });
  });
});
