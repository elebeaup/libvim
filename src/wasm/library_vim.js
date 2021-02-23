const LibraryVim = {
  $VIM: {
    runtime: function () {
      const bufferUpdateCallbackWrapperFactory = (bufferUpdateCallback) => {
        return function (bufferUpdatePtr) {
          const buf = Module.getValue(bufferUpdatePtr, 'i32');
          const firstLineNumber = Module.getValue(bufferUpdatePtr + Module.HEAP32.BYTES_PER_ELEMENT, 'i32'); // first line with change
          const lastLineNumber = Module.getValue(bufferUpdatePtr + Module.HEAP32.BYTES_PER_ELEMENT * 2, 'i32'); // line below last changed line
          const numberExtraLines = Module.getValue(bufferUpdatePtr + Module.HEAP32.BYTES_PER_ELEMENT * 3, 'i32'); // number of extra lines (negative when deleting)

          bufferUpdateCallback({
            firstLineNumber,
            lastLineNumber,
            numberExtraLines,
          });
        };
      };

      const vimCursorGetPositionFactory = () => {
        const vimCursorGetPositionWrapper = Module.cwrap('vimCursorGetPosition', null, ['number']);

        return function () {
          const positionPtr = Module._malloc(HEAP32.BYTES_PER_ELEMENT * 3);

          vimCursorGetPositionWrapper(positionPtr);

          const lineNumber = Module.getValue(positionPtr, 'i32'); // line number
          const columnNumber = Module.getValue(positionPtr + Module.HEAP32.BYTES_PER_ELEMENT, 'i32'); // column number
          const extraVirtualColumn = Module.getValue(positionPtr + Module.HEAP32.BYTES_PER_ELEMENT * 2, 'i32'); // extra virtual column

          Module._free(positionPtr);

          return {
            lineNumber,
            columnNumber,
            extraVirtualColumn,
          };
        };
      };

      const vimCursorSetPositionFactory = () => {
        const vimCursorSetPositionWrapper = Module.cwrap('vimCursorSetPosition', null, ['number']);

        return function (position) {
          const positionPtr = Module._malloc(HEAP32.BYTES_PER_ELEMENT * 2);
          Module.setValue(positionPtr, position.lineNumber, 'i32'); // line number
          Module.setValue(positionPtr + Module.HEAP32.BYTES_PER_ELEMENT, position.columnNumber, 'i32'); // column number

          vimCursorSetPositionWrapper(positionPtr);

          Module._free(positionPtr);
        };
      };

      const vimInit = ({ bufferUpdateCallback }) => {
        Module._vimInit();

        if (bufferUpdateCallback) {
          const bufferUpdateCallbackPtr = Module.addFunction(
            bufferUpdateCallbackWrapperFactory(bufferUpdateCallback),
            'vi'
          );
          Module._vimSetBufferUpdateCallback(bufferUpdateCallbackPtr);
        }
      };

      return {
        vimInit,
        vimInput: Module.cwrap('vimInput', null, ['string']),
        vimKey: Module.cwrap('vimKey', null, ['string']),
        vimGetMode: Module.cwrap('vimGetMode', 'number'),
        vimBufferGetCurrent: Module.cwrap('vimBufferGetCurrent', 'number'),
        vimCursorGetLine: Module.cwrap('vimCursorGetLine', 'number'),
        vimCursorGetColumn: Module.cwrap('vimCursorGetColumn', 'number'),
        vimBufferGetLine: Module.cwrap('vimBufferGetLine', 'string', ['number', 'number']),
        vimExecute: Module.cwrap('vimExecute', null, ['string']),
        vimCursorGetPosition: vimCursorGetPositionFactory(),
        vimCursorSetPosition: vimCursorSetPositionFactory(),
      };
    },
  },

  /*
   * C bridge
   */
  term_set_winsize: function (height, width) {
    console.log(`height=${height}, width=${width}`);
  },
};

autoAddDeps(LibraryVim, '$VIM');
mergeInto(LibraryManager.library, LibraryVim);
