// Copyright 2010 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)

if (!Module.expectedDataFileDownloads) {
  Module.expectedDataFileDownloads = 0;
  Module.finishedDataFileDownloads = 0;
}
Module.expectedDataFileDownloads++;
(function() {
 var loadPackage = function(metadata) {

    var PACKAGE_PATH;
    if (typeof window === 'object') {
      PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
    } else if (typeof location !== 'undefined') {
      // worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
    } else {
      throw 'using preloaded data can only be done on a web page or in a web worker';
    }
    var PACKAGE_NAME = 'jurista.data';
    var REMOTE_PACKAGE_BASE = 'jurista.data';
    if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
      Module['locateFile'] = Module['locateFilePackage'];
      err('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
    }
    var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
  
    var REMOTE_PACKAGE_SIZE = metadata.remote_package_size;
    var PACKAGE_UUID = metadata.package_uuid;
  
    function fetchRemotePackage(packageName, packageSize, callback, errback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', packageName, true);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = function(event) {
        var url = packageName;
        var size = packageSize;
        if (event.total) size = event.total;
        if (event.loaded) {
          if (!xhr.addedTotal) {
            xhr.addedTotal = true;
            if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
            Module.dataFileDownloads[url] = {
              loaded: event.loaded,
              total: size
            };
          } else {
            Module.dataFileDownloads[url].loaded = event.loaded;
          }
          var total = 0;
          var loaded = 0;
          var num = 0;
          for (var download in Module.dataFileDownloads) {
          var data = Module.dataFileDownloads[download];
            total += data.total;
            loaded += data.loaded;
            num++;
          }
          total = Math.ceil(total * Module.expectedDataFileDownloads/num);
          if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
        } else if (!Module.dataFileDownloads) {
          if (Module['setStatus']) Module['setStatus']('Downloading data...');
        }
      };
      xhr.onerror = function(event) {
        throw new Error("NetworkError for: " + packageName);
      }
      xhr.onload = function(event) {
        if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
          var packageData = xhr.response;
          callback(packageData);
        } else {
          throw new Error(xhr.statusText + " : " + xhr.responseURL);
        }
      };
      xhr.send(null);
    };

    function handleError(error) {
      console.error('package error:', error);
    };
  
      var fetchedCallback = null;
      var fetched = Module['getPreloadedPackage'] ? Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;

      if (!fetched) fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
        if (fetchedCallback) {
          fetchedCallback(data);
          fetchedCallback = null;
        } else {
          fetched = data;
        }
      }, handleError);
    
  function runWithFS() {

    function assert(check, msg) {
      if (!check) throw msg + new Error().stack;
    }
Module['FS_createPath']('/', 'resources', true, true);
Module['FS_createPath']('/resources', 'audio', true, true);

    function DataRequest(start, end, audio) {
      this.start = start;
      this.end = end;
      this.audio = audio;
    }
    DataRequest.prototype = {
      requests: {},
      open: function(mode, name) {
        this.name = name;
        this.requests[name] = this;
        Module['addRunDependency']('fp ' + this.name);
      },
      send: function() {},
      onload: function() {
        var byteArray = this.byteArray.subarray(this.start, this.end);
        this.finish(byteArray);
      },
      finish: function(byteArray) {
        var that = this;

        Module['FS_createDataFile'](this.name, null, byteArray, true, true, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
        Module['removeRunDependency']('fp ' + that.name);

        this.requests[this.name] = null;
      }
    };

        var files = metadata.files;
        for (var i = 0; i < files.length; ++i) {
          new DataRequest(files[i].start, files[i].end, files[i].audio).open('GET', files[i].filename);
        }

  
    function processPackageData(arrayBuffer) {
      Module.finishedDataFileDownloads++;
      assert(arrayBuffer, 'Loading data file failed.');
      assert(arrayBuffer instanceof ArrayBuffer, 'bad input to processPackageData');
      var byteArray = new Uint8Array(arrayBuffer);
      var curr;
      
        // Reuse the bytearray from the XHR as the source for file reads.
        DataRequest.prototype.byteArray = byteArray;
  
          var files = metadata.files;
          for (var i = 0; i < files.length; ++i) {
            DataRequest.prototype.requests[files[i].filename].onload();
          }
              Module['removeRunDependency']('datafile_jurista.data');

    };
    Module['addRunDependency']('datafile_jurista.data');
  
    if (!Module.preloadResults) Module.preloadResults = {};
  
      Module.preloadResults[PACKAGE_NAME] = {fromCache: false};
      if (fetched) {
        processPackageData(fetched);
        fetched = null;
      } else {
        fetchedCallback = processPackageData;
      }
    
  }
  if (Module['calledRun']) {
    runWithFS();
  } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
  }

 }
 loadPackage({"files": [{"start": 0, "audio": 0, "end": 109416, "filename": "/resources/answers_back.png"}, {"start": 109416, "audio": 0, "end": 1152178, "filename": "/resources/background.png"}, {"start": 1152178, "audio": 0, "end": 1189423, "filename": "/resources/final_prize.png"}, {"start": 1189423, "audio": 0, "end": 1217311, "filename": "/resources/helper_fifty.png"}, {"start": 1217311, "audio": 0, "end": 1244672, "filename": "/resources/helper_people.png"}, {"start": 1244672, "audio": 0, "end": 1272514, "filename": "/resources/helper_phone.png"}, {"start": 1272514, "audio": 0, "end": 1294588, "filename": "/resources/keepcalm.fnt"}, {"start": 1294588, "audio": 0, "end": 1387312, "filename": "/resources/keepcalm.png"}, {"start": 1387312, "audio": 0, "end": 1387549, "filename": "/resources/qbar.png"}, {"start": 1387549, "audio": 0, "end": 1417721, "filename": "/resources/questions_back.png"}, {"start": 1417721, "audio": 0, "end": 1417960, "filename": "/resources/sbar.png"}, {"start": 1417960, "audio": 0, "end": 1422307, "filename": "/resources/slider_back.png"}, {"start": 1422307, "audio": 0, "end": 1422781, "filename": "/resources/slider_bar.png"}, {"start": 1422781, "audio": 0, "end": 1518528, "filename": "/resources/spinning_coin.png"}, {"start": 1518528, "audio": 0, "end": 1682737, "filename": "/resources/title_back.png"}, {"start": 1682737, "audio": 0, "end": 1703636, "filename": "/resources/title_menu_back.png"}, {"start": 1703636, "audio": 0, "end": 1783943, "filename": "/resources/title_pasta.png"}, {"start": 1783943, "audio": 0, "end": 1786299, "filename": "/resources/videogames.rqm"}, {"start": 1786299, "audio": 1, "end": 1900275, "filename": "/resources/audio/checking.mp3"}, {"start": 1900275, "audio": 1, "end": 1958662, "filename": "/resources/audio/fail.mp3"}, {"start": 1958662, "audio": 1, "end": 3501087, "filename": "/resources/audio/game.mp3"}, {"start": 3501087, "audio": 1, "end": 3588313, "filename": "/resources/audio/interludio.mp3"}, {"start": 3588313, "audio": 1, "end": 4276221, "filename": "/resources/audio/main.mp3"}, {"start": 4276221, "audio": 1, "end": 4481386, "filename": "/resources/audio/perfect.mp3"}, {"start": 4481386, "audio": 1, "end": 4523473, "filename": "/resources/audio/success.mp3"}], "remote_package_size": 4523473, "package_uuid": "40fcc8b9-5199-40a0-b856-52314e8fb8eb"});

})();



// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

Module['arguments'] = [];
Module['thisProgram'] = './this.program';
Module['quit'] = function(status, toThrow) {
  throw toThrow;
};
Module['preRun'] = [];
Module['postRun'] = [];

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;


// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  } else {
    return scriptDirectory + path;
  }
}

if (ENVIRONMENT_IS_NODE) {
  scriptDirectory = __dirname + '/';

  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  var nodeFS;
  var nodePath;

  Module['read'] = function shell_read(filename, binary) {
    var ret;
      if (!nodeFS) nodeFS = require('fs');
      if (!nodePath) nodePath = require('path');
      filename = nodePath['normalize'](filename);
      ret = nodeFS['readFileSync'](filename);
    return binary ? ret : ret.toString();
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  if (process['argv'].length > 1) {
    Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
  }

  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  // Currently node will swallow unhandled rejections, but this behavior is
  // deprecated, and in the future it will exit with error status.
  process['on']('unhandledRejection', abort);

  Module['quit'] = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    Module['read'] = function shell_read(f) {
      return read(f);
    };
  }

  Module['readBinary'] = function readBinary(f) {
    var data;
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof quit === 'function') {
    Module['quit'] = function(status) {
      quit(status);
    }
  }
} else
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }


  Module['read'] = function shell_read(url) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
  };

  if (ENVIRONMENT_IS_WORKER) {
    Module['readBinary'] = function readBinary(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(xhr.response);
    };
  }

  Module['readAsync'] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };

  Module['setWindowTitle'] = function(title) { document.title = title };
} else
{
}

// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
// If the user provided Module.print or printErr, use that. Otherwise,
// console.log is checked first, as 'print' on the web will open a print dialogue
// printErr is preferable to console.warn (works better in shells)
// bind(console) is necessary to fix IE/Edge closed dev tools panel behavior.
var out = Module['print'] || (typeof console !== 'undefined' ? console.log.bind(console) : (typeof print !== 'undefined' ? print : null));
var err = Module['printErr'] || (typeof printErr !== 'undefined' ? printErr : ((typeof console !== 'undefined' && console.warn.bind(console)) || out));

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = undefined;

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message



// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;


function staticAlloc(size) {
  var ret = STATICTOP;
  STATICTOP = (STATICTOP + size + 15) & -16;
  return ret;
}

function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  HEAP32[DYNAMICTOP_PTR>>2] = end;
  if (end >= TOTAL_MEMORY) {
    var success = enlargeMemory();
    if (!success) {
      HEAP32[DYNAMICTOP_PTR>>2] = ret;
      return 0;
    }
  }
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  var ret = size = Math.ceil(size / factor) * factor;
  return ret;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 === 0);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}

var asm2wasmImports = { // special asm2wasm imports
    "f64-rem": function(x, y) {
        return x % y;
    },
    "debugger": function() {
        debugger;
    }
};



var jsCallStartIndex = 1;
var functionPointers = new Array(0);

// 'sig' parameter is only used on LLVM wasm backend
function addFunction(func, sig) {
  var base = 0;
  for (var i = base; i < base + 0; i++) {
    if (!functionPointers[i]) {
      functionPointers[i] = func;
      return jsCallStartIndex + i;
    }
  }
  throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
}

function removeFunction(index) {
  functionPointers[index-jsCallStartIndex] = null;
}

var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}


function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

function dynCall(sig, ptr, args) {
  if (args && args.length) {
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    return Module['dynCall_' + sig].call(null, ptr);
  }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
}

var getTempRet0 = function() {
  return tempRet0;
}


var Runtime = {
  // FIXME backwards compatibility layer for ports. Support some Runtime.*
  //       for now, fix it there, then remove it from here. That way we
  //       can minimize any period of breakage.
  dynCall: dynCall, // for SDL2 port
};

// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;


// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html



//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

var JSfuncs = {
  // Helpers for cwrap -- it can't refer to Runtime directly because it might
  // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
  // out what the minified function name is.
  'stackSave': function() {
    stackSave()
  },
  'stackRestore': function() {
    stackRestore()
  },
  // type conversion from js to c
  'arrayToC' : function(arr) {
    var ret = stackAlloc(arr.length);
    writeArrayToMemory(arr, ret);
    return ret;
  },
  'stringToC' : function(str) {
    var ret = 0;
    if (str !== null && str !== undefined && str !== 0) { // null string
      // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
      var len = (str.length << 2) + 1;
      ret = stackAlloc(len);
      stringToUTF8(str, ret, len);
    }
    return ret;
  }
};

// For fast lookup of conversion functions
var toC = {
  'string': JSfuncs['stringToC'], 'array': JSfuncs['arrayToC']
};


// C calling interface.
function ccall(ident, returnType, argTypes, args, opts) {
  function convertReturnValue(ret) {
    if (returnType === 'string') return Pointer_stringify(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
  argTypes = argTypes || [];
  // When the function takes numbers and returns a number, we can just return
  // the original function
  var numericArgs = argTypes.every(function(type){ return type === 'number'});
  var numericRet = returnType !== 'string';
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  }
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

/** @type {function(number, number, string, boolean=)} */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @type {function(number, string, boolean=)} */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [typeof _malloc === 'function' ? _malloc : staticAlloc, stackAlloc, staticAlloc, dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!staticSealed) return staticAlloc(size);
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}

/** @type {function(number, number=)} */
function Pointer_stringify(ptr, length) {
  if (length === 0 || !ptr) return '';
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return UTF8ToString(ptr);
}

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  while (u8Array[endPtr]) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var u0, u1, u2, u3, u4, u5;

    var str = '';
    while (1) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      u0 = u8Array[idx++];
      if (!u0) return str;
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u3 = u8Array[idx++] & 63;
        if ((u0 & 0xF8) == 0xF0) {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
        } else {
          u4 = u8Array[idx++] & 63;
          if ((u0 & 0xFC) == 0xF8) {
            u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
          } else {
            u5 = u8Array[idx++] & 63;
            u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
          }
        }
      }
      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8,ptr);
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
function UTF16ToString(ptr) {
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

function demangle(func) {
  return func;
}

function demangleAll(text) {
  var regex =
    /__Z[\w\d_]+/g;
  return text.replace(regex,
    function(x) {
      var y = demangle(x);
      return x === y ? x : (y + ' [' + x + ']');
    });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
  return demangleAll(js);
}

// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;
var MIN_TOTAL_MEMORY = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBuffer(buf) {
  Module['buffer'] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
}

var STATIC_BASE, STATICTOP, staticSealed; // static area
var STACK_BASE, STACKTOP, STACK_MAX; // stack area
var DYNAMIC_BASE, DYNAMICTOP_PTR; // dynamic area handled by sbrk

  STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
  staticSealed = false;




function abortOnCannotGrowMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}

if (!Module['reallocBuffer']) Module['reallocBuffer'] = function(size) {
  var ret;
  try {
    var oldHEAP8 = HEAP8;
    ret = new ArrayBuffer(size);
    var temp = new Int8Array(ret);
    temp.set(oldHEAP8);
  } catch(e) {
    return false;
  }
  var success = _emscripten_replace_memory(ret);
  if (!success) return false;
  return ret;
};

function enlargeMemory() {
  // TOTAL_MEMORY is the current size of the actual array, and DYNAMICTOP is the new top.


  var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE; // In wasm, heap size must be a multiple of 64KB. In asm.js, they need to be multiples of 16MB.
  var LIMIT = 2147483648 - PAGE_MULTIPLE; // We can do one page short of 2GB as theoretical maximum.

  if (HEAP32[DYNAMICTOP_PTR>>2] > LIMIT) {
    return false;
  }

  var OLD_TOTAL_MEMORY = TOTAL_MEMORY;
  TOTAL_MEMORY = Math.max(TOTAL_MEMORY, MIN_TOTAL_MEMORY); // So the loop below will not be infinite, and minimum asm.js memory size is 16MB.

  while (TOTAL_MEMORY < HEAP32[DYNAMICTOP_PTR>>2]) { // Keep incrementing the heap size as long as it's less than what is requested.
    if (TOTAL_MEMORY <= 536870912) {
      TOTAL_MEMORY = alignUp(2 * TOTAL_MEMORY, PAGE_MULTIPLE); // Simple heuristic: double until 1GB...
    } else {
      // ..., but after that, add smaller increments towards 2GB, which we cannot reach
      TOTAL_MEMORY = Math.min(alignUp((3 * TOTAL_MEMORY + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
    }
  }



  var replacement = Module['reallocBuffer'](TOTAL_MEMORY);
  if (!replacement || replacement.byteLength != TOTAL_MEMORY) {
    // restore the state to before this call, we failed
    TOTAL_MEMORY = OLD_TOTAL_MEMORY;
    return false;
  }

  // everything worked

  updateGlobalBuffer(replacement);
  updateGlobalBufferViews();



  return true;
}

var byteLength;
try {
  byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get);
  byteLength(new ArrayBuffer(4)); // can fail on older ie
} catch(e) { // can fail on older node/v8
  byteLength = function(buffer) { return buffer.byteLength; };
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK) err('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// Initialize the runtime's memory



// Use a provided buffer, if there is one, or else allocate a new one
if (Module['buffer']) {
  buffer = Module['buffer'];
} else {
  // Use a WebAssembly memory where available
  if (typeof WebAssembly === 'object' && typeof WebAssembly.Memory === 'function') {
    Module['wasmMemory'] = new WebAssembly.Memory({ 'initial': TOTAL_MEMORY / WASM_PAGE_SIZE });
    buffer = Module['wasmMemory'].buffer;
  } else
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
  Module['buffer'] = buffer;
}
updateGlobalBufferViews();


function getTotalMemory() {
  return TOTAL_MEMORY;
}

// Endianness check (note: assumes compiler arch was little-endian)

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data



var memoryInitializer = null;






// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return String.prototype.startsWith ?
      filename.startsWith(dataURIPrefix) :
      filename.indexOf(dataURIPrefix) === 0;
}




function integrateWasmJS() {
  // wasm.js has several methods for creating the compiled code module here:
  //  * 'native-wasm' : use native WebAssembly support in the browser
  //  * 'interpret-s-expr': load s-expression code from a .wast and interpret
  //  * 'interpret-binary': load binary wasm and interpret
  //  * 'interpret-asm2wasm': load asm.js code, translate to wasm, and interpret
  //  * 'asmjs': no wasm, just load the asm.js code and use that (good for testing)
  // The method is set at compile time (BINARYEN_METHOD)
  // The method can be a comma-separated list, in which case, we will try the
  // options one by one. Some of them can fail gracefully, and then we can try
  // the next.

  // inputs

  var method = 'native-wasm';

  var wasmTextFile = 'jurista.wast';
  var wasmBinaryFile = 'jurista.wasm';
  var asmjsCodeFile = 'jurista.temp.asm.js';

  if (!isDataURI(wasmTextFile)) {
    wasmTextFile = locateFile(wasmTextFile);
  }
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }
  if (!isDataURI(asmjsCodeFile)) {
    asmjsCodeFile = locateFile(asmjsCodeFile);
  }

  // utilities

  var wasmPageSize = 64*1024;

  var info = {
    'global': null,
    'env': null,
    'asm2wasm': asm2wasmImports,
    'parent': Module // Module inside wasm-js.cpp refers to wasm-js.cpp; this allows access to the outside program.
  };

  var exports = null;


  function mergeMemory(newBuffer) {
    // The wasm instance creates its memory. But static init code might have written to
    // buffer already, including the mem init file, and we must copy it over in a proper merge.
    // TODO: avoid this copy, by avoiding such static init writes
    // TODO: in shorter term, just copy up to the last static init write
    var oldBuffer = Module['buffer'];
    if (newBuffer.byteLength < oldBuffer.byteLength) {
      err('the new buffer in mergeMemory is smaller than the previous one. in native wasm, we should grow memory here');
    }
    var oldView = new Int8Array(oldBuffer);
    var newView = new Int8Array(newBuffer);


    newView.set(oldView);
    updateGlobalBuffer(newBuffer);
    updateGlobalBufferViews();
  }

  function getBinary() {
    try {
      if (Module['wasmBinary']) {
        return new Uint8Array(Module['wasmBinary']);
      }
      if (Module['readBinary']) {
        return Module['readBinary'](wasmBinaryFile);
      } else {
        throw "both async and sync fetching of the wasm failed";
      }
    }
    catch (err) {
      abort(err);
    }
  }

  function getBinaryPromise() {
    // if we don't have the binary yet, and have the Fetch api, use that
    // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
    if (!Module['wasmBinary'] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(function () {
        return getBinary();
      });
    }
    // Otherwise, getBinary should be able to get it synchronously
    return new Promise(function(resolve, reject) {
      resolve(getBinary());
    });
  }

  // do-method functions


  function doNativeWasm(global, env, providedBuffer) {
    if (typeof WebAssembly !== 'object') {
      err('no native wasm support detected');
      return false;
    }
    // prepare memory import
    if (!(Module['wasmMemory'] instanceof WebAssembly.Memory)) {
      err('no native wasm Memory in use');
      return false;
    }
    env['memory'] = Module['wasmMemory'];
    // Load the wasm module and create an instance of using native support in the JS engine.
    info['global'] = {
      'NaN': NaN,
      'Infinity': Infinity
    };
    info['global.Math'] = Math;
    info['env'] = env;
    // handle a generated wasm instance, receiving its exports and
    // performing other necessary setup
    function receiveInstance(instance, module) {
      exports = instance.exports;
      if (exports.memory) mergeMemory(exports.memory);
      Module['asm'] = exports;
      Module["usingWasm"] = true;
      removeRunDependency('wasm-instantiate');
    }
    addRunDependency('wasm-instantiate');

    // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
    // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
    // to any other async startup actions they are performing.
    if (Module['instantiateWasm']) {
      try {
        return Module['instantiateWasm'](info, receiveInstance);
      } catch(e) {
        err('Module.instantiateWasm callback failed with error: ' + e);
        return false;
      }
    }

    function receiveInstantiatedSource(output) {
      // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
      // receiveInstance() will swap in the exports (to Module.asm) so they can be called
      receiveInstance(output['instance'], output['module']);
    }
    function instantiateArrayBuffer(receiver) {
      getBinaryPromise().then(function(binary) {
        return WebAssembly.instantiate(binary, info);
      }).then(receiver, function(reason) {
        err('failed to asynchronously prepare wasm: ' + reason);
        abort(reason);
      });
    }
    // Prefer streaming instantiation if available.
    if (!Module['wasmBinary'] &&
        typeof WebAssembly.instantiateStreaming === 'function' &&
        !isDataURI(wasmBinaryFile) &&
        typeof fetch === 'function') {
      WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, { credentials: 'same-origin' }), info)
        .then(receiveInstantiatedSource, function(reason) {
          // We expect the most common failure cause to be a bad MIME type for the binary,
          // in which case falling back to ArrayBuffer instantiation should work.
          err('wasm streaming compile failed: ' + reason);
          err('falling back to ArrayBuffer instantiation');
          instantiateArrayBuffer(receiveInstantiatedSource);
        });
    } else {
      instantiateArrayBuffer(receiveInstantiatedSource);
    }
    return {}; // no exports yet; we'll fill them in later
  }


  // We may have a preloaded value in Module.asm, save it
  Module['asmPreload'] = Module['asm'];

  // Memory growth integration code

  var asmjsReallocBuffer = Module['reallocBuffer'];

  var wasmReallocBuffer = function(size) {
    var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE; // In wasm, heap size must be a multiple of 64KB. In asm.js, they need to be multiples of 16MB.
    size = alignUp(size, PAGE_MULTIPLE); // round up to wasm page size
    var old = Module['buffer'];
    var oldSize = old.byteLength;
    if (Module["usingWasm"]) {
      // native wasm support
      try {
        var result = Module['wasmMemory'].grow((size - oldSize) / wasmPageSize); // .grow() takes a delta compared to the previous size
        if (result !== (-1 | 0)) {
          // success in native wasm memory growth, get the buffer from the memory
          return Module['buffer'] = Module['wasmMemory'].buffer;
        } else {
          return null;
        }
      } catch(e) {
        return null;
      }
    }
  };

  Module['reallocBuffer'] = function(size) {
    if (finalMethod === 'asmjs') {
      return asmjsReallocBuffer(size);
    } else {
      return wasmReallocBuffer(size);
    }
  };

  // we may try more than one; this is the final one, that worked and we are using
  var finalMethod = '';

  // Provide an "asm.js function" for the application, called to "link" the asm.js module. We instantiate
  // the wasm module at that time, and it receives imports and provides exports and so forth, the app
  // doesn't need to care that it is wasm or polyfilled wasm or asm.js.

  Module['asm'] = function(global, env, providedBuffer) {
    // import table
    if (!env['table']) {
      var TABLE_SIZE = Module['wasmTableSize'];
      if (TABLE_SIZE === undefined) TABLE_SIZE = 1024; // works in binaryen interpreter at least
      var MAX_TABLE_SIZE = Module['wasmMaxTableSize'];
      if (typeof WebAssembly === 'object' && typeof WebAssembly.Table === 'function') {
        if (MAX_TABLE_SIZE !== undefined) {
          env['table'] = new WebAssembly.Table({ 'initial': TABLE_SIZE, 'maximum': MAX_TABLE_SIZE, 'element': 'anyfunc' });
        } else {
          env['table'] = new WebAssembly.Table({ 'initial': TABLE_SIZE, element: 'anyfunc' });
        }
      } else {
        env['table'] = new Array(TABLE_SIZE); // works in binaryen interpreter at least
      }
      Module['wasmTable'] = env['table'];
    }

    if (!env['__memory_base']) {
      env['__memory_base'] = Module['STATIC_BASE']; // tell the memory segments where to place themselves
    }
    if (!env['__table_base']) {
      env['__table_base'] = 0; // table starts at 0 by default, in dynamic linking this will change
    }

    // try the methods. each should return the exports if it succeeded

    var exports;
    exports = doNativeWasm(global, env, providedBuffer);

    assert(exports, 'no binaryen method succeeded.');


    return exports;
  };

  var methodHandler = Module['asm']; // note our method handler, as we may modify Module['asm'] later
}

integrateWasmJS();

// === Body ===

var ASM_CONSTS = [];





STATIC_BASE = GLOBAL_BASE;

STATICTOP = STATIC_BASE + 110960;
/* global initializers */  __ATINIT__.push();







var STATIC_BUMP = 110960;
Module["STATIC_BASE"] = STATIC_BASE;
Module["STATIC_BUMP"] = STATIC_BUMP;

/* no memory initializer */
var tempDoublePtr = STATICTOP; STATICTOP += 16;

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}

function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}

// {{PRE_LIBRARY}}


  
  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function (stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              var isPosixPlatform = (process.platform != 'win32'); // Node doesn't offer a direct check, so test by exclusion
  
              var fd = process.stdin.fd;
              if (isPosixPlatform) {
                // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
                var usingDevice = false;
                try {
                  fd = fs.openSync('/dev/stdin', 'r');
                  usingDevice = true;
                } catch (e) {}
              }
  
              try {
                bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
              } catch(e) {
                // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                if (e.toString().indexOf('EOF') != -1) bytesRead = 0;
                else throw e;
              }
  
              if (usingDevice) { fs.closeSync(fd); }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
  
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function (node, newCapacity) {
        // If we are asked to expand the size of a file that already exists, revert to using a standard JS array to store the file
        // instead of a typed array. This makes resizing the array more flexible because we can just .push() elements at the back to
        // increase the size.
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
          node.contents = MEMFS.getFileDataAsRegularArray(node);
          node.usedBytes = node.contents.length; // We might be writing to a lazy-loaded file which had overridden this property, so force-reset it.
        }
  
        if (!node.contents || node.contents.subarray) { // Keep using a typed array if creating a new storage, or if old one was a typed array as well.
          var prevCapacity = node.contents ? node.contents.length : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        }
        // Not using a typed array to back the file storage. Use a standard JS array instead.
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0);
      },resizeFileStorage:function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          // If memory can grow, we don't want to hold on to references of
          // the memory Buffer, as they may get invalidated. That means
          // we need to do a copy here.
          canOwn = false;
  
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function (stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        if (!req) {
          return callback("Unable to connect to IndexedDB");
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          if (!fileStore.indexNames.contains('timestamp')) {
            fileStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          try {
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
            transaction.onerror = function(e) {
              callback(this.error);
              e.preventDefault();
            };
  
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
            var index = store.index('timestamp');
  
            index.openKeyCursor().onsuccess = function(event) {
              var cursor = event.target.result;
  
              if (!cursor) {
                return callback(null, { type: 'remote', db: db, entries: entries });
              }
  
              entries[cursor.primaryKey] = { timestamp: cursor.key };
  
              cursor.continue();
            };
          } catch (e) {
            return callback(e);
          }
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function(e) {
          done(this.error);
          e.preventDefault();
        };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
        var flags = process["binding"]("constants");
        // Node.js 4 compatibility: it has no namespaces for constants
        if (flags["fs"]) {
          flags = flags["fs"];
        }
        NODEFS.flagsForNodeMap = {
          "1024": flags["O_APPEND"],
          "64": flags["O_CREAT"],
          "128": flags["O_EXCL"],
          "0": flags["O_RDONLY"],
          "2": flags["O_RDWR"],
          "4096": flags["O_SYNC"],
          "512": flags["O_TRUNC"],
          "1": flags["O_WRONLY"]
        };
      },bufferFrom:function (arrayBuffer) {
        // Node.js < 4.5 compatibility: Buffer.from does not support ArrayBuffer
        // Buffer.from before 4.5 was just a method inherited from Uint8Array
        // Buffer.alloc has been added with Buffer.from together, so check it instead
        return Buffer.alloc ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // Node.js on Windows never represents permission bit 'x', so
            // propagate read bits to execute bits
            stat.mode = stat.mode | ((stat.mode & 292) >> 2);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsForNode:function (flags) {
        flags &= ~0x200000 /*O_PATH*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x800 /*O_NONBLOCK*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x8000 /*O_LARGEFILE*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x80000 /*O_CLOEXEC*/; // Some applications may pass it; it makes no sense for a single process.
        var newFlags = 0;
        for (var k in NODEFS.flagsForNodeMap) {
          if (flags & k) {
            newFlags |= NODEFS.flagsForNodeMap[k];
            flags ^= k;
          }
        }
  
        if (!flags) {
          return newFlags;
        } else {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            path = fs.readlinkSync(path);
            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
            return path;
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // Node.js < 6 compatibility: node errors on 0 length reads
          if (length === 0) return 0;
          try {
            return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },write:function (stream, buffer, offset, length, position) {
          try {
            return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          return position;
        }}};
  
  var WORKERFS={DIR_MODE:16895,FILE_MODE:33279,reader:null,mount:function (mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
        var root = WORKERFS.createNode(null, '/', WORKERFS.DIR_MODE, 0);
        var createdParents = {};
        function ensureParent(path) {
          // return the parent node, creating subdirs as necessary
          var parts = path.split('/');
          var parent = root;
          for (var i = 0; i < parts.length-1; i++) {
            var curr = parts.slice(0, i+1).join('/');
            // Issue 4254: Using curr as a node name will prevent the node
            // from being found in FS.nameTable when FS.open is called on
            // a path which holds a child of this node,
            // given that all FS functions assume node names
            // are just their corresponding parts within their given path,
            // rather than incremental aggregates which include their parent's
            // directories.
            if (!createdParents[curr]) {
              createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0);
            }
            parent = createdParents[curr];
          }
          return parent;
        }
        function base(path) {
          var parts = path.split('/');
          return parts[parts.length-1];
        }
        // We also accept FileList here, by using Array.prototype
        Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
          WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
        });
        (mount.opts["blobs"] || []).forEach(function(obj) {
          WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
        });
        (mount.opts["packages"] || []).forEach(function(pack) {
          pack['metadata'].files.forEach(function(file) {
            var name = file.filename.substr(1); // remove initial slash
            WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack['blob'].slice(file.start, file.end));
          });
        });
        return root;
      },createNode:function (parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
          node.size = contents.size;
          node.contents = contents;
        } else {
          node.size = 4096;
          node.contents = {};
        }
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },node_ops:{getattr:function (node) {
          return {
            dev: 1,
            ino: undefined,
            mode: node.mode,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: undefined,
            size: node.size,
            atime: new Date(node.timestamp),
            mtime: new Date(node.timestamp),
            ctime: new Date(node.timestamp),
            blksize: 4096,
            blocks: Math.ceil(node.size / 4096),
          };
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },rename:function (oldNode, newDir, newName) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },unlink:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },rmdir:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },readdir:function (node) {
          var entries = ['.', '..'];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newName, oldPath) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },readlink:function (node) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          if (position >= stream.node.size) return 0;
          var chunk = stream.node.contents.slice(position, position + length);
          var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
          buffer.set(new Uint8Array(ab), offset);
          return chunk.size;
        },write:function (stream, buffer, offset, length, position) {
          throw new FS.ErrnoError(ERRNO_CODES.EIO);
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.size;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        }}};
  
  var _stdin=STATICTOP; STATICTOP += 16;;
  
  var _stdout=STATICTOP; STATICTOP += 16;;
  
  var _stderr=STATICTOP; STATICTOP += 16;;var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); }
            }
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0;
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
              (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          console.log('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(err) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(err);
        }
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdirTree:function (path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != ERRNO_CODES.EEXIST) throw e;
          }
        }
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            console.log("FS.trackingDelegate error on read file: " + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },isClosed:function (stream) {
        return stream.fd === null;
      },llseek:function (stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },msync:function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:function (stream) {
        return 0;
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function(stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto !== 'undefined') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else if (ENVIRONMENT_IS_NODE) {
          // for nodejs
          random_device = function() { return require('crypto')['randomBytes'](1)[0]; };
        } else {
          // default for ES5 platforms
          random_device = function() { abort("random_device"); /*Math.random() is not safe for random number generation, so this fallback random_device implementation aborts... see kripken/emscripten/pull/7096 */ };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:function () {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: function() {
            var node = FS.createNode('/proc/self', 'fd', 16384 | 511 /* 0777 */, 73);
            node.node_ops = {
              lookup: function(parent, name) {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: function() { return stream.path } }
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
          // Node.js compatibility: assigning on this.stack fails on Node 4 (but fixed on Node 8)
          if (this.stack) Object.defineProperty(this, "stack", { value: (new Error).stack, writable: true });
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
          'IDBFS': IDBFS,
          'NODEFS': NODEFS,
          'WORKERFS': WORKERFS,
        };
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          if (usesGzip || !datalength) {
            // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
            chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
            datalength = this.getter(0).length;
            chunkSize = datalength;
            console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
          }
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              }
            }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init(); // XXX perhaps this method should move onto Browser?
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  
  
  function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
  
      if (!Browser.mainLoop.func) {
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0 /*EM_TIMING_SETTIMEOUT*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
          var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now())|0;
          setTimeout(Browser.mainLoop.runner, timeUntilNextTick); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else if (mode == 1 /*EM_TIMING_RAF*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      } else if (mode == 2 /*EM_TIMING_SETIMMEDIATE*/) {
        if (typeof setImmediate === 'undefined') {
          // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
          var setImmediates = [];
          var emscriptenMainLoopMessageId = 'setimmediate';
          function Browser_setImmediate_messageHandler(event) {
            // When called in current thread or Worker, the main loop ID is structured slightly different to accommodate for --proxy-to-worker runtime listening to Worker events,
            // so check for both cases.
            if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
              event.stopPropagation();
              setImmediates.shift()();
            }
          }
          addEventListener("message", Browser_setImmediate_messageHandler, true);
          setImmediate = function Browser_emulated_setImmediate(func) {
            setImmediates.push(func);
            if (ENVIRONMENT_IS_WORKER) {
              if (Module['setImmediates'] === undefined) Module['setImmediates'] = [];
              Module['setImmediates'].push(func);
              postMessage({target: emscriptenMainLoopMessageId}); // In --proxy-to-worker, route the message via proxyClient.js
            } else postMessage(emscriptenMainLoopMessageId, "*"); // On the main thread, can just send the message to itself.
          }
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
          setImmediate(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'immediate';
      }
      return 0;
    }
  
  function _emscripten_get_now() { abort() }function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
      Module['noExitRuntime'] = true;
  
      assert(!Browser.mainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
  
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
  
      var browserIterationFunc;
      if (typeof arg !== 'undefined') {
        browserIterationFunc = function() {
          Module['dynCall_vi'](func, arg);
        };
      } else {
        browserIterationFunc = function() {
          Module['dynCall_v'](func);
        };
      }
  
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
  
          // catches pause/resume main loop from blocker execution
          if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Implement very basic swap interval control
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1/*EM_TIMING_RAF*/ && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          Browser.mainLoop.scheduler();
          return;
        } else if (Browser.mainLoop.timingMode == 0/*EM_TIMING_SETTIMEOUT*/) {
          Browser.mainLoop.tickStartTime = _emscripten_get_now();
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
  
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          err('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        Browser.mainLoop.runIter(browserIterationFunc);
  
  
        // catch pauses from the main loop itself
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
        // to queue the newest produced audio samples.
        // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
        //       do not need to be hardcoded into this function, but can be more generic.
        if (typeof SDL === 'object' && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  
        Browser.mainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 1000.0 / fps);
        else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, 1); // Do rAF by rendering each frame (no decimating)
  
        Browser.mainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:function () {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++; // Incrementing this signals the previous main loop that it's now become old, and it must return.
        },resume:function () {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true /* do not set timing and call scheduler, we will do it on the next lines */);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) err('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullscreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
  
        // Canvas event setup
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === Module['canvas'] ||
                                document['mozPointerLockElement'] === Module['canvas'] ||
                                document['webkitPointerLockElement'] === Module['canvas'] ||
                                document['msPointerLockElement'] === Module['canvas'];
        }
        var canvas = Module['canvas'];
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
  
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && Module['canvas'].requestPointerLock) {
                Module['canvas'].requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullscreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullscreen:function (lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === 'undefined') Browser.vrDevice = null;
  
        var canvas = Module['canvas'];
        function fullscreenChange() {
          Browser.isFullscreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['fullscreenElement'] || document['mozFullScreenElement'] ||
               document['msFullscreenElement'] || document['webkitFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.exitFullscreen = document['exitFullscreen'] ||
                                    document['cancelFullScreen'] ||
                                    document['mozCancelFullScreen'] ||
                                    document['msExitFullscreen'] ||
                                    document['webkitCancelFullScreen'] ||
                                    function() {};
            canvas.exitFullscreen = canvas.exitFullscreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullscreen = true;
            if (Browser.resizeCanvas) {
              Browser.setFullscreenCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          } else {
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
  
            if (Browser.resizeCanvas) {
              Browser.setWindowedCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullscreen);
          if (Module['onFullscreen']) Module['onFullscreen'](Browser.isFullscreen);
        }
  
        if (!Browser.fullscreenHandlersInstalled) {
          Browser.fullscreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullscreenChange, false);
          document.addEventListener('mozfullscreenchange', fullscreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullscreenChange, false);
          document.addEventListener('MSFullscreenChange', fullscreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullscreen = canvasContainer['requestFullscreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullscreen'] ? function() { canvasContainer['webkitRequestFullscreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null) ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
  
        if (vrDevice) {
          canvasContainer.requestFullscreen({ vrDisplay: vrDevice });
        } else {
          canvasContainer.requestFullscreen();
        }
      },requestFullScreen:function (lockPointer, resizeCanvas, vrDevice) {
          err('Browser.requestFullScreen() is deprecated. Please call Browser.requestFullscreen instead.');
          Browser.requestFullScreen = function(lockPointer, resizeCanvas, vrDevice) {
            return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
          }
          return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },allowAsyncCallbacks:true,queuedAsyncCallbacks:[],pauseAsyncCallbacks:function () {
        Browser.allowAsyncCallbacks = false;
      },resumeAsyncCallbacks:function () { // marks future callbacks as ok to execute, and synchronously runs any remaining ones right now
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function(func) {
            func();
          });
        }
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } // drop it on the floor otherwise, next interval will kick in
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll':
            delta = event.detail;
            break;
          case 'mousewheel':
            delta = event.wheelDelta;
            break;
          case 'wheel':
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
  
          // check if SDL is available
          if (typeof SDL != "undefined") {
            Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
            Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
            // just add the mouse delta to the current absolut mouse position
            // FIXME: ideally this should be clamped against the canvas size and zero
            Browser.mouseX += Browser.mouseMovementX;
            Browser.mouseY += Browser.mouseMovementY;
          }
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
  
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              var last = Browser.touches[touch.identifier];
              if (!last) last = coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            }
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        var dep = !noRunDep ? getUniqueRunDependency('al ' + url) : '';
        Module['readAsync'](url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (dep) removeRunDependency(dep);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (dep) addRunDependency(dep);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullscreenCanvasSize:function () {
        // check if SDL is available
        if (typeof SDL != "undefined") {
          var flags = HEAPU32[((SDL.screen)>>2)];
          flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
          HEAP32[((SDL.screen)>>2)]=flags
        }
        Browser.updateCanvasDimensions(Module['canvas']);
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available
        if (typeof SDL != "undefined") {
          var flags = HEAPU32[((SDL.screen)>>2)];
          flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
          HEAP32[((SDL.screen)>>2)]=flags
        }
        Browser.updateCanvasDimensions(Module['canvas']);
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['fullscreenElement'] || document['mozFullScreenElement'] ||
             document['msFullscreenElement'] || document['webkitFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};
  
  function _SDL_GetTicks() {
      return (Date.now() - SDL.startTime)|0;
    }
  
  function _SDL_LockSurface(surf) {
      var surfData = SDL.surfaces[surf];
  
      surfData.locked++;
      if (surfData.locked > 1) return 0;
  
      if (!surfData.buffer) {
        surfData.buffer = _malloc(surfData.width * surfData.height * 4);
        HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
      }
  
      // Mark in C/C++-accessible SDL structure
      // SDL_Surface has the following fields: Uint32 flags, SDL_PixelFormat *format; int w, h; Uint16 pitch; void *pixels; ...
      // So we have fields all of the same size, and 5 of them before us.
      // TODO: Use macros like in library.js
      HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
  
      if (surf == SDL.screen && Module.screenIsReadOnly && surfData.image) return 0;
  
      if (SDL.defaults.discardOnLock) {
        if (!surfData.image) {
          surfData.image = surfData.ctx.createImageData(surfData.width, surfData.height);
        }
        if (!SDL.defaults.opaqueFrontBuffer) return;
      } else {
        surfData.image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
      }
  
      // Emulate desktop behavior and kill alpha values on the locked surface. (very costly!) Set SDL.defaults.opaqueFrontBuffer = false
      // if you don't want this.
      if (surf == SDL.screen && SDL.defaults.opaqueFrontBuffer) {
        var data = surfData.image.data;
        var num = data.length;
        for (var i = 0; i < num/4; i++) {
          data[i*4+3] = 255; // opacity, as canvases blend alpha
        }
      }
  
      if (SDL.defaults.copyOnLock && !SDL.defaults.discardOnLock) {
        // Copy pixel data to somewhere accessible to 'C/C++'
        if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
          // If this is neaded then
          // we should compact the data from 32bpp to 8bpp index.
          // I think best way to implement this is use
          // additional colorMap hash (color->index).
          // Something like this:
          //
          // var size = surfData.width * surfData.height;
          // var data = '';
          // for (var i = 0; i<size; i++) {
          //   var color = SDL.translateRGBAToColor(
          //     surfData.image.data[i*4   ],
          //     surfData.image.data[i*4 +1],
          //     surfData.image.data[i*4 +2],
          //     255);
          //   var index = surfData.colorMap[color];
          //   HEAP8[(((surfData.buffer)+(i))>>0)]=index;
          // }
          throw 'CopyOnLock is not supported for SDL_LockSurface with SDL_HWPALETTE flag set' + new Error().stack;
        } else {
          HEAPU8.set(surfData.image.data, surfData.buffer);
        }
      }
  
      return 0;
    }var SDL={defaults:{width:320,height:200,copyOnLock:true,discardOnLock:false,opaqueFrontBuffer:true},version:null,surfaces:{},canvasPool:[],events:[],fonts:[null],audios:[null],rwops:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,glAttributes:{0:3,1:3,2:2,3:0,4:0,5:1,6:16,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:1,16:0,17:0,18:0},keyboardState:null,keyboardMap:{},canRequestFullscreen:false,isRequestingFullscreen:false,textInput:false,startTime:null,initFlags:0,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},TOUCH_DEFAULT_ID:0,eventHandler:null,eventHandlerContext:null,eventHandlerTemp:0,keyCodes:{16:1249,17:1248,18:1250,20:1081,33:1099,34:1102,35:1101,36:1098,37:1104,38:1106,39:1103,40:1105,44:316,45:1097,46:127,91:1251,93:1125,96:1122,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,106:1109,107:1111,109:1110,110:1123,111:1108,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,124:1128,125:1129,126:1130,127:1131,128:1132,129:1133,130:1134,131:1135,132:1136,133:1137,134:1138,135:1139,144:1107,160:94,161:33,162:34,163:35,164:36,165:37,166:38,167:95,168:40,169:41,170:42,171:43,172:124,173:45,174:123,175:125,176:126,181:127,182:129,183:128,188:44,190:46,191:47,192:96,219:91,220:92,221:93,222:39,224:1251},scanCodes:{8:42,9:43,13:40,27:41,32:44,35:204,39:53,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,58:203,59:51,61:46,91:47,92:49,93:48,96:52,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,127:76,305:224,308:226,316:70},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + 0)>>2)],
          y: HEAP32[((rect + 4)>>2)],
          w: HEAP32[((rect + 8)>>2)],
          h: HEAP32[((rect + 12)>>2)]
        };
      },updateRect:function (rect, r) {
        HEAP32[((rect)>>2)]=r.x;
        HEAP32[(((rect)+(4))>>2)]=r.y;
        HEAP32[(((rect)+(8))>>2)]=r.w;
        HEAP32[(((rect)+(12))>>2)]=r.h;
      },intersectionOfRects:function (first, second) {
        var leftX = Math.max(first.x, second.x);
        var leftY = Math.max(first.y, second.y);
        var rightX = Math.min(first.x + first.w, second.x + second.w);
        var rightY = Math.min(first.y + first.h, second.y + second.h);
  
        return {
          x: leftX,
          y: leftY,
          w: Math.max(leftX, rightX) - leftX,
          h: Math.max(leftY, rightY) - leftY
        }
      },checkPixelFormat:function (fmt) {
      },loadColorToCSSRGB:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgb(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ')';
      },loadColorToCSSRGBA:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgba(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ',' + (((rgba >> 24)&255)/255) + ')';
      },translateColorToCSSRGBA:function (rgba) {
        return 'rgba(' + (rgba&0xff) + ',' + (rgba>>8 & 0xff) + ',' + (rgba>>16 & 0xff) + ',' + (rgba>>>24)/0xff + ')';
      },translateRGBAToCSSRGBA:function (r, g, b, a) {
        return 'rgba(' + (r&0xff) + ',' + (g&0xff) + ',' + (b&0xff) + ',' + (a&0xff)/255 + ')';
      },translateRGBAToColor:function (r, g, b, a) {
        return r | g << 8 | b << 16 | a << 24;
      },makeSurface:function (width, height, flags, usePageCanvas, source, rmask, gmask, bmask, amask) {
        flags = flags || 0;
        var is_SDL_HWSURFACE = flags & 0x00000001;
        var is_SDL_HWPALETTE = flags & 0x00200000;
        var is_SDL_OPENGL = flags & 0x04000000;
  
        var surf = _malloc(60);
        var pixelFormat = _malloc(44);
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
        var buffer = 0;
  
        // preemptively initialize this for software surfaces,
        // otherwise it will be lazily initialized inside of SDL_LockSurface
        if (!is_SDL_HWSURFACE && !is_SDL_OPENGL) {
          buffer = _malloc(width * height * 4);
        }
  
        HEAP32[((surf)>>2)]=flags;
        HEAP32[(((surf)+(4))>>2)]=pixelFormat;
        HEAP32[(((surf)+(8))>>2)]=width;
        HEAP32[(((surf)+(12))>>2)]=height;
        HEAP32[(((surf)+(16))>>2)]=width * bpp;  // assuming RGBA or indexed for now,
                                                                                          // since that is what ImageData gives us in browsers
        HEAP32[(((surf)+(20))>>2)]=buffer;
  
        HEAP32[(((surf)+(36))>>2)]=0;
        HEAP32[(((surf)+(40))>>2)]=0;
        HEAP32[(((surf)+(44))>>2)]=Module["canvas"].width;
        HEAP32[(((surf)+(48))>>2)]=Module["canvas"].height;
  
        HEAP32[(((surf)+(56))>>2)]=1;
  
        HEAP32[((pixelFormat)>>2)]=-2042224636;
        HEAP32[(((pixelFormat)+(4))>>2)]=0;// TODO
        HEAP8[(((pixelFormat)+(8))>>0)]=bpp * 8;
        HEAP8[(((pixelFormat)+(9))>>0)]=bpp;
  
        HEAP32[(((pixelFormat)+(12))>>2)]=rmask || 0x000000ff;
        HEAP32[(((pixelFormat)+(16))>>2)]=gmask || 0x0000ff00;
        HEAP32[(((pixelFormat)+(20))>>2)]=bmask || 0x00ff0000;
        HEAP32[(((pixelFormat)+(24))>>2)]=amask || 0xff000000;
  
        // Decide if we want to use WebGL or not
        SDL.GL = SDL.GL || is_SDL_OPENGL;
        var canvas;
        if (!usePageCanvas) {
          if (SDL.canvasPool.length > 0) {
            canvas = SDL.canvasPool.pop();
          } else {
            canvas = document.createElement('canvas');
          }
          canvas.width = width;
          canvas.height = height;
        } else {
          canvas = Module['canvas'];
        }
  
        var webGLContextAttributes = {
          antialias: ((SDL.glAttributes[13 /*SDL_GL_MULTISAMPLEBUFFERS*/] != 0) && (SDL.glAttributes[14 /*SDL_GL_MULTISAMPLESAMPLES*/] > 1)),
          depth: (SDL.glAttributes[6 /*SDL_GL_DEPTH_SIZE*/] > 0),
          stencil: (SDL.glAttributes[7 /*SDL_GL_STENCIL_SIZE*/] > 0),
          alpha: (SDL.glAttributes[3 /*SDL_GL_ALPHA_SIZE*/] > 0)
        };
  
        var ctx = Browser.createContext(canvas, is_SDL_OPENGL, usePageCanvas, webGLContextAttributes);
  
        SDL.surfaces[surf] = {
          width: width,
          height: height,
          canvas: canvas,
          ctx: ctx,
          surf: surf,
          buffer: buffer,
          pixelFormat: pixelFormat,
          alpha: 255,
          flags: flags,
          locked: 0,
          usePageCanvas: usePageCanvas,
          source: source,
  
          isFlagSet: function(flag) {
            return flags & flag;
          }
        };
  
        return surf;
      },copyIndexedColorData:function (surfData, rX, rY, rW, rH) {
        // HWPALETTE works with palette
        // setted by SDL_SetColors
        if (!surfData.colors) {
          return;
        }
  
        var fullWidth  = Module['canvas'].width;
        var fullHeight = Module['canvas'].height;
  
        var startX  = rX || 0;
        var startY  = rY || 0;
        var endX    = (rW || (fullWidth - startX)) + startX;
        var endY    = (rH || (fullHeight - startY)) + startY;
  
        var buffer  = surfData.buffer;
  
        if (!surfData.image.data32) {
          surfData.image.data32 = new Uint32Array(surfData.image.data.buffer);
        }
        var data32   = surfData.image.data32;
  
        var colors32 = surfData.colors32;
  
        for (var y = startY; y < endY; ++y) {
          var base = y * fullWidth;
          for (var x = startX; x < endX; ++x) {
            data32[base + x] = colors32[HEAPU8[((buffer + base + x)>>0)]];
          }
        }
      },freeSurface:function (surf) {
        var refcountPointer = surf + 56;
        var refcount = HEAP32[((refcountPointer)>>2)];
        if (refcount > 1) {
          HEAP32[((refcountPointer)>>2)]=refcount - 1;
          return;
        }
  
        var info = SDL.surfaces[surf];
        if (!info.usePageCanvas && info.canvas) SDL.canvasPool.push(info.canvas);
        if (info.buffer) _free(info.buffer);
        _free(info.pixelFormat);
        _free(surf);
        SDL.surfaces[surf] = null;
  
        if (surf === SDL.screen) {
          SDL.screen = null;
        }
      },blitSurface:function (src, srcrect, dst, dstrect, scale) {
        var srcData = SDL.surfaces[src];
        var dstData = SDL.surfaces[dst];
        var sr, dr;
        if (srcrect) {
          sr = SDL.loadRect(srcrect);
        } else {
          sr = { x: 0, y: 0, w: srcData.width, h: srcData.height };
        }
        if (dstrect) {
          dr = SDL.loadRect(dstrect);
        } else {
          dr = { x: 0, y: 0, w: srcData.width, h: srcData.height };
        }
        if (dstData.clipRect) {
          var widthScale = (!scale || sr.w === 0) ? 1 : sr.w / dr.w;
          var heightScale = (!scale || sr.h === 0) ? 1 : sr.h / dr.h;
  
          dr = SDL.intersectionOfRects(dstData.clipRect, dr);
  
          sr.w = dr.w * widthScale;
          sr.h = dr.h * heightScale;
  
          if (dstrect) {
            SDL.updateRect(dstrect, dr);
          }
        }
        var blitw, blith;
        if (scale) {
          blitw = dr.w; blith = dr.h;
        } else {
          blitw = sr.w; blith = sr.h;
        }
        if (sr.w === 0 || sr.h === 0 || blitw === 0 || blith === 0) {
          return 0;
        }
        var oldAlpha = dstData.ctx.globalAlpha;
        dstData.ctx.globalAlpha = srcData.alpha/255;
        dstData.ctx.drawImage(srcData.canvas, sr.x, sr.y, sr.w, sr.h, dr.x, dr.y, blitw, blith);
        dstData.ctx.globalAlpha = oldAlpha;
        if (dst != SDL.screen) {
          // XXX As in IMG_Load, for compatibility we write out |pixels|
          warnOnce('WARNING: copying canvas data to memory for compatibility');
          _SDL_LockSurface(dst);
          dstData.locked--; // The surface is not actually locked in this hack
        }
        return 0;
      },downFingers:{},savedKeydown:null,receiveEvent:function (event) {
        function unpressAllPressedKeys() {
          // Un-press all pressed keys: TODO
          for (var code in SDL.keyboardMap) {
            SDL.events.push({
              type: 'keyup',
              keyCode: SDL.keyboardMap[code]
            });
          }
        };
        switch(event.type) {
          case 'touchstart': case 'touchmove': {
            event.preventDefault();
  
            var touches = [];
  
            // Clear out any touchstart events that we've already processed
            if (event.type === 'touchstart') {
              for (var i = 0; i < event.touches.length; i++) {
                var touch = event.touches[i];
                if (SDL.downFingers[touch.identifier] != true) {
                  SDL.downFingers[touch.identifier] = true;
                  touches.push(touch);
                }
              }
            } else {
              touches = event.touches;
            }
  
            var firstTouch = touches[0];
            if (firstTouch) {
              if (event.type == 'touchstart') {
                SDL.DOMButtons[0] = 1;
              }
              var mouseEventType;
              switch(event.type) {
                case 'touchstart': mouseEventType = 'mousedown'; break;
                case 'touchmove': mouseEventType = 'mousemove'; break;
              }
              var mouseEvent = {
                type: mouseEventType,
                button: 0,
                pageX: firstTouch.clientX,
                pageY: firstTouch.clientY
              };
              SDL.events.push(mouseEvent);
            }
  
            for (var i = 0; i < touches.length; i++) {
              var touch = touches[i];
              SDL.events.push({
                type: event.type,
                touch: touch
              });
            };
            break;
          }
          case 'touchend': {
            event.preventDefault();
  
            // Remove the entry in the SDL.downFingers hash
            // because the finger is no longer down.
            for(var i = 0; i < event.changedTouches.length; i++) {
              var touch = event.changedTouches[i];
              if (SDL.downFingers[touch.identifier] === true) {
                delete SDL.downFingers[touch.identifier];
              }
            }
  
            var mouseEvent = {
              type: 'mouseup',
              button: 0,
              pageX: event.changedTouches[0].clientX,
              pageY: event.changedTouches[0].clientY
            };
            SDL.DOMButtons[0] = 0;
            SDL.events.push(mouseEvent);
  
            for (var i = 0; i < event.changedTouches.length; i++) {
              var touch = event.changedTouches[i];
              SDL.events.push({
                type: 'touchend',
                touch: touch
              });
            };
            break;
          }
          case 'DOMMouseScroll': case 'mousewheel': case 'wheel':
            var delta = -Browser.getMouseWheelDelta(event); // Flip the wheel direction to translate from browser wheel direction (+:down) to SDL direction (+:up)
            delta = (delta == 0) ? 0 : (delta > 0 ? Math.max(delta, 1) : Math.min(delta, -1)); // Quantize to integer so that minimum scroll is at least +/- 1.
  
            // Simulate old-style SDL events representing mouse wheel input as buttons
            var button = delta > 0 ? 3 /*SDL_BUTTON_WHEELUP-1*/ : 4 /*SDL_BUTTON_WHEELDOWN-1*/; // Subtract one since JS->C marshalling is defined to add one back.
            SDL.events.push({ type: 'mousedown', button: button, pageX: event.pageX, pageY: event.pageY });
            SDL.events.push({ type: 'mouseup', button: button, pageX: event.pageX, pageY: event.pageY });
  
            // Pass a delta motion event.
            SDL.events.push({ type: 'wheel', deltaX: 0, deltaY: delta });
            event.preventDefault(); // If we don't prevent this, then 'wheel' event will be sent again by the browser as 'DOMMouseScroll' and we will receive this same event the second time.
            break;
          case 'mousemove':
            if (SDL.DOMButtons[0] === 1) {
              SDL.events.push({
                type: 'touchmove',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
            }
            if (Browser.pointerLock) {
              // workaround for firefox bug 750111
              if ('mozMovementX' in event) {
                event['movementX'] = event['mozMovementX'];
                event['movementY'] = event['mozMovementY'];
              }
              // workaround for Firefox bug 782777
              if (event['movementX'] == 0 && event['movementY'] == 0) {
                // ignore a mousemove event if it doesn't contain any movement info
                // (without pointer lock, we infer movement from pageX/pageY, so this check is unnecessary)
                event.preventDefault();
                return;
              }
            }
            // fall through
          case 'keydown': case 'keyup': case 'keypress': case 'mousedown': case 'mouseup':
            // If we preventDefault on keydown events, the subsequent keypress events
            // won't fire. However, it's fine (and in some cases necessary) to
            // preventDefault for keys that don't generate a character. Otherwise,
            // preventDefault is the right thing to do in general.
            if (event.type !== 'keydown' || (!SDL.unicode && !SDL.textInput) || (event.keyCode === 8 /* backspace */ || event.keyCode === 9 /* tab */)) {
              event.preventDefault();
            }
  
            if (event.type == 'mousedown') {
              SDL.DOMButtons[event.button] = 1;
              SDL.events.push({
                type: 'touchstart',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
            } else if (event.type == 'mouseup') {
              // ignore extra ups, can happen if we leave the canvas while pressing down, then return,
              // since we add a mouseup in that case
              if (!SDL.DOMButtons[event.button]) {
                return;
              }
  
              SDL.events.push({
                type: 'touchend',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
              SDL.DOMButtons[event.button] = 0;
            }
  
            // We can only request fullscreen as the result of user input.
            // Due to this limitation, we toggle a boolean on keydown which
            // SDL_WM_ToggleFullScreen will check and subsequently set another
            // flag indicating for us to request fullscreen on the following
            // keyup. This isn't perfect, but it enables SDL_WM_ToggleFullScreen
            // to work as the result of a keypress (which is an extremely
            // common use case).
            if (event.type === 'keydown' || event.type === 'mousedown') {
              SDL.canRequestFullscreen = true;
            } else if (event.type === 'keyup' || event.type === 'mouseup') {
              if (SDL.isRequestingFullscreen) {
                Module['requestFullscreen'](/*lockPointer=*/true, /*resizeCanvas=*/true);
                SDL.isRequestingFullscreen = false;
              }
              SDL.canRequestFullscreen = false;
            }
  
            // SDL expects a unicode character to be passed to its keydown events.
            // Unfortunately, the browser APIs only provide a charCode property on
            // keypress events, so we must backfill in keydown events with their
            // subsequent keypress event's charCode.
            if (event.type === 'keypress' && SDL.savedKeydown) {
              // charCode is read-only
              SDL.savedKeydown.keypressCharCode = event.charCode;
              SDL.savedKeydown = null;
            } else if (event.type === 'keydown') {
              SDL.savedKeydown = event;
            }
  
            // Don't push keypress events unless SDL_StartTextInput has been called.
            if (event.type !== 'keypress' || SDL.textInput) {
              SDL.events.push(event);
            }
            break;
          case 'mouseout':
            // Un-press all pressed mouse buttons, because we might miss the release outside of the canvas
            for (var i = 0; i < 3; i++) {
              if (SDL.DOMButtons[i]) {
                SDL.events.push({
                  type: 'mouseup',
                  button: i,
                  pageX: event.pageX,
                  pageY: event.pageY
                });
                SDL.DOMButtons[i] = 0;
              }
            }
            event.preventDefault();
            break;
          case 'focus':
            SDL.events.push(event);
            event.preventDefault();
            break;
          case 'blur':
            SDL.events.push(event);
            unpressAllPressedKeys();
            event.preventDefault();
            break;
          case 'visibilitychange':
            SDL.events.push({
              type: 'visibilitychange',
              visible: !document.hidden
            });
            unpressAllPressedKeys();
            event.preventDefault();
            break;
          case 'unload':
            if (Browser.mainLoop.runner) {
              SDL.events.push(event);
              // Force-run a main event loop, since otherwise this event will never be caught!
              Browser.mainLoop.runner();
            }
            return;
          case 'resize':
            SDL.events.push(event);
            // manually triggered resize event doesn't have a preventDefault member
            if (event.preventDefault) {
              event.preventDefault();
            }
            break;
        }
        if (SDL.events.length >= 10000) {
          err('SDL event queue full, dropping events');
          SDL.events = SDL.events.slice(0, 10000);
        }
        // If we have a handler installed, this will push the events to the app
        // instead of the app polling for them.
        SDL.flushEventsToHandler();
        return;
      },lookupKeyCodeForEvent:function (event) {
          var code = event.keyCode;
          if (code >= 65 && code <= 90) {
            code += 32; // make lowercase for SDL
          } else {
            code = SDL.keyCodes[event.keyCode] || event.keyCode;
            // If this is one of the modifier keys (224 | 1<<10 - 227 | 1<<10), and the event specifies that it is
            // a right key, add 4 to get the right key SDL key code.
            if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT && code >= (224 | 1<<10) && code <= (227 | 1<<10)) {
              code += 4;
            }
          }
          return code;
      },handleEvent:function (event) {
        if (event.handled) return;
        event.handled = true;
  
        switch (event.type) {
          case 'touchstart': case 'touchend': case 'touchmove': {
            Browser.calculateMouseEvent(event);
            break;
          }
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            var code = SDL.lookupKeyCodeForEvent(event);
            HEAP8[(((SDL.keyboardState)+(code))>>0)]=down;
            // TODO: lmeta, rmeta, numlock, capslock, KMOD_MODE, KMOD_RESERVED
            SDL.modState = (HEAP8[(((SDL.keyboardState)+(1248))>>0)] ? 0x0040 : 0) | // KMOD_LCTRL
              (HEAP8[(((SDL.keyboardState)+(1249))>>0)] ? 0x0001 : 0) | // KMOD_LSHIFT
              (HEAP8[(((SDL.keyboardState)+(1250))>>0)] ? 0x0100 : 0) | // KMOD_LALT
              (HEAP8[(((SDL.keyboardState)+(1252))>>0)] ? 0x0080 : 0) | // KMOD_RCTRL
              (HEAP8[(((SDL.keyboardState)+(1253))>>0)] ? 0x0002 : 0) | // KMOD_RSHIFT
              (HEAP8[(((SDL.keyboardState)+(1254))>>0)] ? 0x0200 : 0); //  KMOD_RALT
            if (down) {
              SDL.keyboardMap[code] = event.keyCode; // save the DOM input, which we can use to unpress it during blur
            } else {
              delete SDL.keyboardMap[code];
            }
  
            break;
          }
          case 'mousedown': case 'mouseup':
            if (event.type == 'mousedown') {
              // SDL_BUTTON(x) is defined as (1 << ((x)-1)).  SDL buttons are 1-3,
              // and DOM buttons are 0-2, so this means that the below formula is
              // correct.
              SDL.buttonState |= 1 << event.button;
            } else if (event.type == 'mouseup') {
              SDL.buttonState &= ~(1 << event.button);
            }
            // fall through
          case 'mousemove': {
            Browser.calculateMouseEvent(event);
            break;
          }
        }
      },flushEventsToHandler:function () {
        if (!SDL.eventHandler) return;
  
        while (SDL.pollEvent(SDL.eventHandlerTemp)) {
          Module['dynCall_iii'](SDL.eventHandler, SDL.eventHandlerContext, SDL.eventHandlerTemp);
        }
      },pollEvent:function (ptr) {
        if (SDL.initFlags & 0x200 && SDL.joystickEventState) {
          // If SDL_INIT_JOYSTICK was supplied AND the joystick system is configured
          // to automatically query for events, query for joystick events.
          SDL.queryJoysticks();
        }
        if (ptr) {
          while (SDL.events.length > 0) {
            if (SDL.makeCEvent(SDL.events.shift(), ptr) !== false) return 1;
          }
          return 0;
        } else {
          // XXX: somewhat risky in that we do not check if the event is real or not (makeCEvent returns false) if no pointer supplied
          return SDL.events.length > 0;
        }
      },makeCEvent:function (event, ptr) {
        if (typeof event === 'number') {
          // This is a pointer to a copy of a native C event that was SDL_PushEvent'ed
          _memcpy(ptr, event, 28);
          _free(event); // the copy is no longer needed
          return;
        }
  
        SDL.handleEvent(event);
  
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            //out('Received key event: ' + event.keyCode);
            var key = SDL.lookupKeyCodeForEvent(event);
            var scan;
            if (key >= 1024) {
              scan = key - 1024;
            } else {
              scan = SDL.scanCodes[key] || key;
            }
  
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(8))>>0)]=down ? 1 : 0;
            HEAP8[(((ptr)+(9))>>0)]=0; // TODO
            HEAP32[(((ptr)+(12))>>2)]=scan;
            HEAP32[(((ptr)+(16))>>2)]=key;
            HEAP16[(((ptr)+(20))>>1)]=SDL.modState;
            // some non-character keys (e.g. backspace and tab) won't have keypressCharCode set, fill in with the keyCode.
            HEAP32[(((ptr)+(24))>>2)]=event.keypressCharCode || key;
  
            break;
          }
          case 'keypress': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(8 + i))>>0)]=cStr[i];
            }
            break;
          }
          case 'mousedown': case 'mouseup': case 'mousemove': {
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP32[(((ptr)+(4))>>2)]=0;
              HEAP32[(((ptr)+(8))>>2)]=0;
              HEAP32[(((ptr)+(12))>>2)]=0;
              HEAP8[(((ptr)+(16))>>0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(17))>>0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseY;
            } else {
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP32[(((ptr)+(4))>>2)]=0;
              HEAP32[(((ptr)+(8))>>2)]=0;
              HEAP32[(((ptr)+(12))>>2)]=0;
              HEAP32[(((ptr)+(16))>>2)]=SDL.buttonState;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(28))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(32))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'wheel': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(16))>>2)]=event.deltaX;
            HEAP32[(((ptr)+(20))>>2)]=event.deltaY;
            break;
          }
          case 'touchstart': case 'touchend': case 'touchmove': {
            var touch = event.touch;
            if (!Browser.touches[touch.identifier]) break;
            var w = Module['canvas'].width;
            var h = Module['canvas'].height;
            var x = Browser.touches[touch.identifier].x / w;
            var y = Browser.touches[touch.identifier].y / h;
            var lx = Browser.lastTouches[touch.identifier].x / w;
            var ly = Browser.lastTouches[touch.identifier].y / h;
            var dx = x - lx;
            var dy = y - ly;
            if (touch['deviceID'] === undefined) touch.deviceID = SDL.TOUCH_DEFAULT_ID;
            if (dx === 0 && dy === 0 && event.type === 'touchmove') return false; // don't send these if nothing happened
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=_SDL_GetTicks();
            (tempI64 = [touch.deviceID>>>0,(tempDouble=touch.deviceID,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((ptr)+(8))>>2)]=tempI64[0],HEAP32[(((ptr)+(12))>>2)]=tempI64[1]);
            (tempI64 = [touch.identifier>>>0,(tempDouble=touch.identifier,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((ptr)+(16))>>2)]=tempI64[0],HEAP32[(((ptr)+(20))>>2)]=tempI64[1]);
            HEAPF32[(((ptr)+(24))>>2)]=x;
            HEAPF32[(((ptr)+(28))>>2)]=y;
            HEAPF32[(((ptr)+(32))>>2)]=dx;
            HEAPF32[(((ptr)+(36))>>2)]=dy;
            if (touch.force !== undefined) {
              HEAPF32[(((ptr)+(40))>>2)]=touch.force;
            } else { // No pressure data, send a digital 0/1 pressure.
              HEAPF32[(((ptr)+(40))>>2)]=event.type == "touchend" ? 0 : 1;
            }
            break;
          }
          case 'unload': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=event.w;
            HEAP32[(((ptr)+(8))>>2)]=event.h;
            break;
          }
          case 'joystick_button_up': case 'joystick_button_down': {
            var state = event.type === 'joystick_button_up' ? 0 : 1;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))>>0)]=event.index;
            HEAP8[(((ptr)+(5))>>0)]=event.button;
            HEAP8[(((ptr)+(6))>>0)]=state;
            break;
          }
          case 'joystick_axis_motion': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))>>0)]=event.index;
            HEAP8[(((ptr)+(5))>>0)]=event.axis;
            HEAP32[(((ptr)+(8))>>2)]=SDL.joystickAxisValueConversion(event.value);
            break;
          }
          case 'focus': {
            var SDL_WINDOWEVENT_FOCUS_GAINED = 12 /* SDL_WINDOWEVENT_FOCUS_GAINED */;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=0;
            HEAP8[(((ptr)+(8))>>0)]=SDL_WINDOWEVENT_FOCUS_GAINED;
            break;
          }
          case 'blur': {
            var SDL_WINDOWEVENT_FOCUS_LOST = 13 /* SDL_WINDOWEVENT_FOCUS_LOST */;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=0;
            HEAP8[(((ptr)+(8))>>0)]=SDL_WINDOWEVENT_FOCUS_LOST;
            break;
          }
          case 'visibilitychange': {
            var SDL_WINDOWEVENT_SHOWN  = 1 /* SDL_WINDOWEVENT_SHOWN */;
            var SDL_WINDOWEVENT_HIDDEN = 2 /* SDL_WINDOWEVENT_HIDDEN */;
            var visibilityEventID = event.visible ? SDL_WINDOWEVENT_SHOWN : SDL_WINDOWEVENT_HIDDEN;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=0;
            HEAP8[(((ptr)+(8))>>0)]=visibilityEventID;
            break;
          }
          default: throw 'Unhandled SDL event: ' + event.type;
        }
      },makeFontString:function (height, fontName) {
        if (fontName.charAt(0) != "'" && fontName.charAt(0) != '"') {
          // https://developer.mozilla.org/ru/docs/Web/CSS/font-family
          // Font family names containing whitespace should be quoted.
          // BTW, quote all font names is easier than searching spaces
          fontName = '"' + fontName + '"';
        }
        return height + 'px ' + fontName + ', serif';
      },estimateTextWidth:function (fontData, text) {
        var h = fontData.size;
        var fontString = SDL.makeFontString(h, fontData.name);
        var tempCtx = SDL.ttfContext;
        tempCtx.save();
        tempCtx.font = fontString;
        var ret = tempCtx.measureText(text).width | 0;
        tempCtx.restore();
        return ret;
      },allocateChannels:function (num) { // called from Mix_AllocateChannels and init
        if (SDL.numChannels && SDL.numChannels >= num && num != 0) return;
        SDL.numChannels = num;
        SDL.channels = [];
        for (var i = 0; i < num; i++) {
          SDL.channels[i] = {
            audio: null,
            volume: 1.0
          };
        }
      },setGetVolume:function (info, volume) {
        if (!info) return 0;
        var ret = info.volume * 128; // MIX_MAX_VOLUME
        if (volume != -1) {
          info.volume = Math.min(Math.max(volume, 0), 128) / 128;
          if (info.audio) {
            try {
              info.audio.volume = info.volume; // For <audio> element
              if (info.audio.webAudioGainNode) info.audio.webAudioGainNode['gain']['value'] = info.volume; // For WebAudio playback
            } catch(e) {
              err('setGetVolume failed to set audio volume: ' + e);
            }
          }
        }
        return ret;
      },setPannerPosition:function (info, x, y, z) {
        if (!info) return;
        if (info.audio) {
          if (info.audio.webAudioPannerNode) {
            info.audio.webAudioPannerNode['setPosition'](x, y, z);
          }
        }
      },playWebAudio:function (audio) {
        if (!audio) return;
        if (audio.webAudioNode) return; // This instance is already playing, don't start again.
        if (!SDL.webAudioAvailable()) return;
        try {
          var webAudio = audio.resource.webAudio;
          audio.paused = false;
          if (!webAudio.decodedBuffer) {
            if (webAudio.onDecodeComplete === undefined) abort("Cannot play back audio object that was not loaded");
            webAudio.onDecodeComplete.push(function() { if (!audio.paused) SDL.playWebAudio(audio); });
            return;
          }
          audio.webAudioNode = SDL.audioContext['createBufferSource']();
          audio.webAudioNode['buffer'] = webAudio.decodedBuffer;
          audio.webAudioNode['loop'] = audio.loop;
          audio.webAudioNode['onended'] = function() { audio['onended'](); } // For <media> element compatibility, route the onended signal to the instance.
  
          audio.webAudioPannerNode = SDL.audioContext['createPanner']();
          // avoid Chrome bug
          // If posz = 0, the sound will come from only the right.
          // By posz = -0.5 (slightly ahead), the sound will come from right and left correctly.
          audio.webAudioPannerNode["setPosition"](0, 0, -.5);
          audio.webAudioPannerNode['panningModel'] = 'equalpower';
  
          // Add an intermediate gain node to control volume.
          audio.webAudioGainNode = SDL.audioContext['createGain']();
          audio.webAudioGainNode['gain']['value'] = audio.volume;
  
          audio.webAudioNode['connect'](audio.webAudioPannerNode);
          audio.webAudioPannerNode['connect'](audio.webAudioGainNode);
          audio.webAudioGainNode['connect'](SDL.audioContext['destination']);
  
          audio.webAudioNode['start'](0, audio.currentPosition);
          audio.startTime = SDL.audioContext['currentTime'] - audio.currentPosition;
        } catch(e) {
          err('playWebAudio failed: ' + e);
        }
      },pauseWebAudio:function (audio) {
        if (!audio) return;
        if (audio.webAudioNode) {
          try {
            // Remember where we left off, so that if/when we resume, we can restart the playback at a proper place.
            audio.currentPosition = (SDL.audioContext['currentTime'] - audio.startTime) % audio.resource.webAudio.decodedBuffer.duration;
            // Important: When we reach here, the audio playback is stopped by the user. But when calling .stop() below, the Web Audio
            // graph will send the onended signal, but we don't want to process that, since pausing should not clear/destroy the audio
            // channel.
            audio.webAudioNode['onended'] = undefined;
            audio.webAudioNode.stop(0); // 0 is a default parameter, but WebKit is confused by it #3861
            audio.webAudioNode = undefined;
          } catch(e) {
            err('pauseWebAudio failed: ' + e);
          }
        }
        audio.paused = true;
      },openAudioContext:function () {
        // Initialize Web Audio API if we haven't done so yet. Note: Only initialize Web Audio context ever once on the web page,
        // since initializing multiple times fails on Chrome saying 'audio resources have been exhausted'.
        if (!SDL.audioContext) {
          if (typeof(AudioContext) !== 'undefined') SDL.audioContext = new AudioContext();
          else if (typeof(webkitAudioContext) !== 'undefined') SDL.audioContext = new webkitAudioContext();
        }
      },webAudioAvailable:function () { return !!SDL.audioContext; },fillWebAudioBufferFromHeap:function (heapPtr, sizeSamplesPerChannel, dstAudioBuffer) {
        // The input audio data is interleaved across the channels, i.e. [L, R, L, R, L, R, ...] and is either 8-bit, 16-bit or float as
        // supported by the SDL API. The output audio wave data for Web Audio API must be in planar buffers of [-1,1]-normalized Float32 data,
        // so perform a buffer conversion for the data.
        var numChannels = SDL.audio.channels;
        for(var c = 0; c < numChannels; ++c) {
          var channelData = dstAudioBuffer['getChannelData'](c);
          if (channelData.length != sizeSamplesPerChannel) {
            throw 'Web Audio output buffer length mismatch! Destination size: ' + channelData.length + ' samples vs expected ' + sizeSamplesPerChannel + ' samples!';
          }
          if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              channelData[j] = (HEAP16[(((heapPtr)+((j*numChannels + c)*2))>>1)]) / 0x8000;
            }
          } else if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              var v = (HEAP8[(((heapPtr)+(j*numChannels + c))>>0)]);
              channelData[j] = ((v >= 0) ? v-128 : v+128) /128;
            }
          } else if (SDL.audio.format == 0x8120 /*AUDIO_F32*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              channelData[j] = (HEAPF32[(((heapPtr)+((j*numChannels + c)*4))>>2)]);
            }
          } else {
            throw 'Invalid SDL audio format ' + SDL.audio.format + '!';
          }
        }
      },debugSurface:function (surfData) {
        console.log('dumping surface ' + [surfData.surf, surfData.source, surfData.width, surfData.height]);
        var image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
        var data = image.data;
        var num = Math.min(surfData.width, surfData.height);
        for (var i = 0; i < num; i++) {
          console.log('   diagonal ' + i + ':' + [data[i*surfData.width*4 + i*4 + 0], data[i*surfData.width*4 + i*4 + 1], data[i*surfData.width*4 + i*4 + 2], data[i*surfData.width*4 + i*4 + 3]]);
        }
      },joystickEventState:1,lastJoystickState:{},joystickNamePool:{},recordJoystickState:function (joystick, state) {
        // Standardize button state.
        var buttons = new Array(state.buttons.length);
        for (var i = 0; i < state.buttons.length; i++) {
          buttons[i] = SDL.getJoystickButtonState(state.buttons[i]);
        }
  
        SDL.lastJoystickState[joystick] = {
          buttons: buttons,
          axes: state.axes.slice(0),
          timestamp: state.timestamp,
          index: state.index,
          id: state.id
        };
      },getJoystickButtonState:function (button) {
        if (typeof button === 'object') {
          // Current gamepad API editor's draft (Firefox Nightly)
          // https://dvcs.w3.org/hg/gamepad/raw-file/default/gamepad.html#idl-def-GamepadButton
          return button['pressed'];
        } else {
          // Current gamepad API working draft (Firefox / Chrome Stable)
          // http://www.w3.org/TR/2012/WD-gamepad-20120529/#gamepad-interface
          return button > 0;
        }
      },queryJoysticks:function () {
        for (var joystick in SDL.lastJoystickState) {
          var state = SDL.getGamepad(joystick - 1);
          var prevState = SDL.lastJoystickState[joystick];
          // If joystick was removed, state returns null.
          if (typeof state === 'undefined') return;
          if (state === null) return;
          // Check only if the timestamp has differed.
          // NOTE: Timestamp is not available in Firefox.
          // NOTE: Timestamp is currently not properly set for the GearVR controller
          //       on Samsung Internet: it is always zero.
          if (typeof state.timestamp !== 'number' || state.timestamp !== prevState.timestamp || !state.timestamp) {
            var i;
            for (i = 0; i < state.buttons.length; i++) {
              var buttonState = SDL.getJoystickButtonState(state.buttons[i]);
              // NOTE: The previous state already has a boolean representation of
              //       its button, so no need to standardize its button state here.
              if (buttonState !== prevState.buttons[i]) {
                // Insert button-press event.
                SDL.events.push({
                  type: buttonState ? 'joystick_button_down' : 'joystick_button_up',
                  joystick: joystick,
                  index: joystick - 1,
                  button: i
                });
              }
            }
            for (i = 0; i < state.axes.length; i++) {
              if (state.axes[i] !== prevState.axes[i]) {
                // Insert axes-change event.
                SDL.events.push({
                  type: 'joystick_axis_motion',
                  joystick: joystick,
                  index: joystick - 1,
                  axis: i,
                  value: state.axes[i]
                });
              }
            }
  
            SDL.recordJoystickState(joystick, state);
          }
        }
      },joystickAxisValueConversion:function (value) {
        // Make sure value is properly clamped
        value = Math.min(1, Math.max(value, -1));
        // Ensures that 0 is 0, 1 is 32767, and -1 is 32768.
        return Math.ceil(((value+1) * 32767.5) - 32768);
      },getGamepads:function () {
        var fcn = navigator.getGamepads || navigator.webkitGamepads || navigator.mozGamepads || navigator.gamepads || navigator.webkitGetGamepads;
        if (fcn !== undefined) {
          // The function must be applied on the navigator object.
          return fcn.apply(navigator);
        } else {
          return [];
        }
      },getGamepad:function (deviceIndex) {
        var gamepads = SDL.getGamepads();
        if (gamepads.length > deviceIndex && deviceIndex >= 0) {
          return gamepads[deviceIndex];
        }
        return null;
      }};function _SDL_PauseAudio(pauseOn) {
      if (!SDL.audio) {
        return;
      }
      if (pauseOn) {
        if (SDL.audio.timer !== undefined) {
          clearTimeout(SDL.audio.timer);
          SDL.audio.numAudioTimersPending = 0;
          SDL.audio.timer = undefined;
        }
      } else if (!SDL.audio.timer) {
        // Start the audio playback timer callback loop.
        SDL.audio.numAudioTimersPending = 1;
        SDL.audio.timer = Browser.safeSetTimeout(SDL.audio.caller, 1);
      }
      SDL.audio.paused = pauseOn;
    }function _SDL_CloseAudio() {
      if (SDL.audio) {
        _SDL_PauseAudio(1);
        _free(SDL.audio.buffer);
        SDL.audio = null;
        SDL.allocateChannels(0);
      }
    }

  function _SDL_InitSubSystem(flags) { return 0 }

  function _SDL_OpenAudio(desired, obtained) {
      try {
        SDL.audio = {
          freq: HEAPU32[((desired)>>2)],
          format: HEAPU16[(((desired)+(4))>>1)],
          channels: HEAPU8[(((desired)+(6))>>0)],
          samples: HEAPU16[(((desired)+(8))>>1)], // Samples in the CB buffer per single sound channel.
          callback: HEAPU32[(((desired)+(16))>>2)],
          userdata: HEAPU32[(((desired)+(20))>>2)],
          paused: true,
          timer: null
        };
        // The .silence field tells the constant sample value that corresponds to the safe un-skewed silence value for the wave data.
        if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
          SDL.audio.silence = 128; // Audio ranges in [0, 255], so silence is half-way in between.
        } else if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
          SDL.audio.silence = 0; // Signed data in range [-32768, 32767], silence is 0.
        } else if (SDL.audio.format == 0x8120 /*AUDIO_F32*/) {
          SDL.audio.silence = 0.0; // Float data in range [-1.0, 1.0], silence is 0.0
        } else {
          throw 'Invalid SDL audio format ' + SDL.audio.format + '!';
        }
        // Round the desired audio frequency up to the next 'common' frequency value.
        // Web Audio API spec states 'An implementation must support sample-rates in at least the range 22050 to 96000.'
        if (SDL.audio.freq <= 0) {
          throw 'Unsupported sound frequency ' + SDL.audio.freq + '!';
        } else if (SDL.audio.freq <= 22050) {
          SDL.audio.freq = 22050; // Take it safe and clamp everything lower than 22kHz to that.
        } else if (SDL.audio.freq <= 32000) {
          SDL.audio.freq = 32000;
        } else if (SDL.audio.freq <= 44100) {
          SDL.audio.freq = 44100;
        } else if (SDL.audio.freq <= 48000) {
          SDL.audio.freq = 48000;
        } else if (SDL.audio.freq <= 96000) {
          SDL.audio.freq = 96000;
        } else {
          throw 'Unsupported sound frequency ' + SDL.audio.freq + '!';
        }
        if (SDL.audio.channels == 0) {
          SDL.audio.channels = 1; // In SDL both 0 and 1 mean mono.
        } else if (SDL.audio.channels < 0 || SDL.audio.channels > 32) {
          throw 'Unsupported number of audio channels for SDL audio: ' + SDL.audio.channels + '!';
        } else if (SDL.audio.channels != 1 && SDL.audio.channels != 2) { // Unsure what SDL audio spec supports. Web Audio spec supports up to 32 channels.
          console.log('Warning: Using untested number of audio channels ' + SDL.audio.channels);
        }
        if (SDL.audio.samples < 128 || SDL.audio.samples > 524288 /* arbitrary cap */) {
          throw 'Unsupported audio callback buffer size ' + SDL.audio.samples + '!';
        } else if ((SDL.audio.samples & (SDL.audio.samples-1)) != 0) {
          throw 'Audio callback buffer size ' + SDL.audio.samples + ' must be a power-of-two!';
        }
  
        var totalSamples = SDL.audio.samples*SDL.audio.channels;
        if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
          SDL.audio.bytesPerSample = 1;
        } else if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
          SDL.audio.bytesPerSample = 2;
        } else if (SDL.audio.format == 0x8120 /*AUDIO_F32*/) {
          SDL.audio.bytesPerSample = 4;
        } else {
          throw 'Invalid SDL audio format ' + SDL.audio.format + '!';
        }
        SDL.audio.bufferSize = totalSamples*SDL.audio.bytesPerSample;
        SDL.audio.bufferDurationSecs = SDL.audio.bufferSize / SDL.audio.bytesPerSample / SDL.audio.channels / SDL.audio.freq; // Duration of a single queued buffer in seconds.
        SDL.audio.bufferingDelay = 50 / 1000; // Audio samples are played with a constant delay of this many seconds to account for browser and jitter.
        SDL.audio.buffer = _malloc(SDL.audio.bufferSize);
  
        // To account for jittering in frametimes, always have multiple audio buffers queued up for the audio output device.
        // This helps that we won't starve that easily if a frame takes long to complete.
        SDL.audio.numSimultaneouslyQueuedBuffers = Module['SDL_numSimultaneouslyQueuedBuffers'] || 5;
  
        // Pulls and queues new audio data if appropriate. This function gets "over-called" in both requestAnimationFrames and
        // setTimeouts to ensure that we get the finest granularity possible and as many chances from the browser to fill
        // new audio data. This is because setTimeouts alone have very poor granularity for audio streaming purposes, but also
        // the application might not be using emscripten_set_main_loop to drive the main loop, so we cannot rely on that alone.
        SDL.audio.queueNewAudioData = function SDL_queueNewAudioData() {
          if (!SDL.audio) return;
  
          for(var i = 0; i < SDL.audio.numSimultaneouslyQueuedBuffers; ++i) {
            // Only queue new data if we don't have enough audio data already in queue. Otherwise skip this time slot
            // and wait to queue more in the next time the callback is run.
            var secsUntilNextPlayStart = SDL.audio.nextPlayTime - SDL.audioContext['currentTime'];
            if (secsUntilNextPlayStart >= SDL.audio.bufferingDelay + SDL.audio.bufferDurationSecs*SDL.audio.numSimultaneouslyQueuedBuffers) return;
  
            // Ask SDL audio data from the user code.
            Module['dynCall_viii'](SDL.audio.callback, SDL.audio.userdata, SDL.audio.buffer, SDL.audio.bufferSize);
            // And queue it to be played after the currently playing audio stream.
            SDL.audio.pushAudio(SDL.audio.buffer, SDL.audio.bufferSize);
          }
        }
  
  
        // Create a callback function that will be routinely called to ask more audio data from the user application.
        SDL.audio.caller = function SDL_audioCaller() {
          if (!SDL.audio) return;
  
          --SDL.audio.numAudioTimersPending;
  
          SDL.audio.queueNewAudioData();
  
          // Queue this callback function to be called again later to pull more audio data.
          var secsUntilNextPlayStart = SDL.audio.nextPlayTime - SDL.audioContext['currentTime'];
  
          // Queue the next audio frame push to be performed half-way when the previously queued buffer has finished playing.
          var preemptBufferFeedSecs = SDL.audio.bufferDurationSecs/2.0;
  
          if (SDL.audio.numAudioTimersPending < SDL.audio.numSimultaneouslyQueuedBuffers) {
            ++SDL.audio.numAudioTimersPending;
            SDL.audio.timer = Browser.safeSetTimeout(SDL.audio.caller, Math.max(0.0, 1000.0*(secsUntilNextPlayStart-preemptBufferFeedSecs)));
  
            // If we are risking starving, immediately queue an extra buffer.
            if (SDL.audio.numAudioTimersPending < SDL.audio.numSimultaneouslyQueuedBuffers) {
              ++SDL.audio.numAudioTimersPending;
              Browser.safeSetTimeout(SDL.audio.caller, 1.0);
            }
          }
        };
  
        SDL.audio.audioOutput = new Audio();
  
        // Initialize Web Audio API if we haven't done so yet. Note: Only initialize Web Audio context ever once on the web page,
        // since initializing multiple times fails on Chrome saying 'audio resources have been exhausted'.
        SDL.openAudioContext();
        if (!SDL.audioContext) throw 'Web Audio API is not available!';
        SDL.audio.nextPlayTime = 0; // Time in seconds when the next audio block is due to start.
  
        // The pushAudio function with a new audio buffer whenever there is new audio data to schedule to be played back on the device.
        SDL.audio.pushAudio=function(ptr,sizeBytes) {
          try {
            if (SDL.audio.paused) return;
  
            var sizeSamples = sizeBytes / SDL.audio.bytesPerSample; // How many samples fit in the callback buffer?
            var sizeSamplesPerChannel = sizeSamples / SDL.audio.channels; // How many samples per a single channel fit in the cb buffer?
            if (sizeSamplesPerChannel != SDL.audio.samples) {
              throw 'Received mismatching audio buffer size!';
            }
            // Allocate new sound buffer to be played.
            var source = SDL.audioContext['createBufferSource']();
            var soundBuffer = SDL.audioContext['createBuffer'](SDL.audio.channels,sizeSamplesPerChannel,SDL.audio.freq);
            source['connect'](SDL.audioContext['destination']);
  
            SDL.fillWebAudioBufferFromHeap(ptr, sizeSamplesPerChannel, soundBuffer);
            // Workaround https://bugzilla.mozilla.org/show_bug.cgi?id=883675 by setting the buffer only after filling. The order is important here!
            source['buffer'] = soundBuffer;
  
            // Schedule the generated sample buffer to be played out at the correct time right after the previously scheduled
            // sample buffer has finished.
            var curtime = SDL.audioContext['currentTime'];
            // Don't ever start buffer playbacks earlier from current time than a given constant 'SDL.audio.bufferingDelay', since a browser
            // may not be able to mix that audio clip in immediately, and there may be subsequent jitter that might cause the stream to starve.
            var playtime = Math.max(curtime + SDL.audio.bufferingDelay, SDL.audio.nextPlayTime);
            if (typeof source['start'] !== 'undefined') {
              source['start'](playtime); // New Web Audio API: sound sources are started with a .start() call.
            } else if (typeof source['noteOn'] !== 'undefined') {
              source['noteOn'](playtime); // Support old Web Audio API specification which had the .noteOn() API.
            }
            /*
            // Uncomment to debug SDL buffer feed starves.
            if (SDL.audio.curBufferEnd) {
              var thisBufferStart = Math.round(playtime * SDL.audio.freq);
              if (thisBufferStart != SDL.audio.curBufferEnd) console.log('SDL starved ' + (thisBufferStart - SDL.audio.curBufferEnd) + ' samples!');
            }
            SDL.audio.curBufferEnd = Math.round(playtime * SDL.audio.freq + sizeSamplesPerChannel);
            */
  
            SDL.audio.nextPlayTime = playtime + SDL.audio.bufferDurationSecs;
          } catch(e) {
            console.log('Web Audio API error playing back audio: ' + e.toString());
          }
        }
  
        if (obtained) {
          // Report back the initialized audio parameters.
          HEAP32[((obtained)>>2)]=SDL.audio.freq;
          HEAP16[(((obtained)+(4))>>1)]=SDL.audio.format;
          HEAP8[(((obtained)+(6))>>0)]=SDL.audio.channels;
          HEAP8[(((obtained)+(7))>>0)]=SDL.audio.silence;
          HEAP16[(((obtained)+(8))>>1)]=SDL.audio.samples;
          HEAP32[(((obtained)+(16))>>2)]=SDL.audio.callback;
          HEAP32[(((obtained)+(20))>>2)]=SDL.audio.userdata;
        }
        SDL.allocateChannels(32);
  
      } catch(e) {
        console.log('Initializing SDL audio threw an exception: "' + e.toString() + '"! Continuing without audio.');
        SDL.audio = null;
        SDL.allocateChannels(0);
        if (obtained) {
          HEAP32[((obtained)>>2)]=0;
          HEAP16[(((obtained)+(4))>>1)]=0;
          HEAP8[(((obtained)+(6))>>0)]=0;
          HEAP8[(((obtained)+(7))>>0)]=0;
          HEAP16[(((obtained)+(8))>>1)]=0;
          HEAP32[(((obtained)+(16))>>2)]=0;
          HEAP32[(((obtained)+(20))>>2)]=0;
        }
      }
      if (!SDL.audio) {
        return -1;
      }
      return 0;
    }


  function _SDL_QuitSubSystem(flags) {
      out('SDL_QuitSubSystem called (and ignored)');
    }

  function _TextFormat() {
  err('missing function: TextFormat'); abort(-1);
  }

  function ___assert_fail(condition, filename, line, func) {
      abort('Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function']);
    }

  function ___lock() {}

  
  var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:function (dirfd, path) {
        if (path[0] !== '/') {
          // relative path
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      },doStat:function (func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -ERRNO_CODES.ENOTDIR;
          }
          throw e;
        }
        HEAP32[((buf)>>2)]=stat.dev;
        HEAP32[(((buf)+(4))>>2)]=0;
        HEAP32[(((buf)+(8))>>2)]=stat.ino;
        HEAP32[(((buf)+(12))>>2)]=stat.mode;
        HEAP32[(((buf)+(16))>>2)]=stat.nlink;
        HEAP32[(((buf)+(20))>>2)]=stat.uid;
        HEAP32[(((buf)+(24))>>2)]=stat.gid;
        HEAP32[(((buf)+(28))>>2)]=stat.rdev;
        HEAP32[(((buf)+(32))>>2)]=0;
        HEAP32[(((buf)+(36))>>2)]=stat.size;
        HEAP32[(((buf)+(40))>>2)]=4096;
        HEAP32[(((buf)+(44))>>2)]=stat.blocks;
        HEAP32[(((buf)+(48))>>2)]=(stat.atime.getTime() / 1000)|0;
        HEAP32[(((buf)+(52))>>2)]=0;
        HEAP32[(((buf)+(56))>>2)]=(stat.mtime.getTime() / 1000)|0;
        HEAP32[(((buf)+(60))>>2)]=0;
        HEAP32[(((buf)+(64))>>2)]=(stat.ctime.getTime() / 1000)|0;
        HEAP32[(((buf)+(68))>>2)]=0;
        HEAP32[(((buf)+(72))>>2)]=stat.ino;
        return 0;
      },doMsync:function (addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags);
      },doMkdir:function (path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
        FS.mkdir(path, mode, 0);
        return 0;
      },doMknod:function (path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default: return -ERRNO_CODES.EINVAL;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },doReadlink:function (path, buf, bufsize) {
        if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
        var ret = FS.readlink(path);
  
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf+len];
        stringToUTF8(ret, buf, bufsize+1);
        // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
        // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
        HEAP8[buf+len] = endChar;
  
        return len;
      },doAccess:function (path, amode) {
        if (amode & ~7) {
          // need a valid mode
          return -ERRNO_CODES.EINVAL;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
          return -ERRNO_CODES.EACCES;
        }
        return 0;
      },doDup:function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },doReadv:function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.read(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break; // nothing more to read
        }
        return ret;
      },doWritev:function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.write(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
      },getStreamFromFD:function () {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return stream;
      },getSocketFromFD:function () {
        var socket = SOCKFS.getSocket(SYSCALLS.get());
        if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return socket;
      },getSocketAddress:function (allowNull) {
        var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
        if (allowNull && addrp === 0) return null;
        var info = __read_sockaddr(addrp, addrlen);
        if (info.errno) throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      },getZero:function () {
        assert(SYSCALLS.get() === 0);
      }};function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      // NOTE: offset_high is unused - Emscripten's off_t is 32-bit
      var offset = offset_low;
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)]=stream.position;
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall145(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // readv
      var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      return SYSCALLS.doReadv(stream, iov, iovcnt);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      return SYSCALLS.doWritev(stream, iov, iovcnt);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall221(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // fcntl64
      var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
      switch (cmd) {
        case 0: {
          var arg = SYSCALLS.get();
          if (arg < 0) {
            return -ERRNO_CODES.EINVAL;
          }
          var newStream;
          newStream = FS.open(stream.path, stream.flags, 0, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = SYSCALLS.get();
          stream.flags |= arg;
          return 0;
        }
        case 12:
        case 12: {
          var arg = SYSCALLS.get();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=2;
          return 0;
        }
        case 13:
        case 14:
        case 13:
        case 14:
          return 0; // Pretend that the locking is successful.
        case 16:
        case 8:
          return -ERRNO_CODES.EINVAL; // These are for sockets. We don't have them fully implemented yet.
        case 9:
          // musl trusts getown return values, due to a bug where they must be, as they overlap with errors. just return -1 here, so fnctl() returns that, and we set errno ourselves.
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        default: {
          return -ERRNO_CODES.EINVAL;
        }
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall5(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // open
      var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get() // optional TODO
      var stream = FS.open(pathname, flags, mode);
      return stream.fd;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
      switch (op) {
        case 21509:
        case 21505: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        case 21510:
        case 21511:
        case 21512:
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          var argp = SYSCALLS.get();
          HEAP32[((argp)>>2)]=0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return -ERRNO_CODES.EINVAL; // not supported
        }
        case 21531: {
          var argp = SYSCALLS.get();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        default: abort('bad ioctl syscall ' + op);
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___unlock() {}

  
  var EGL={errorCode:12288,defaultDisplayInitialized:false,currentContext:0,currentReadSurface:0,currentDrawSurface:0,alpha:false,depth:true,stencil:true,antialias:true,stringCache:{},setErrorCode:function (code) {
        EGL.errorCode = code;
      },chooseConfig:function (display, attribList, config, config_size, numConfigs) { 
        if (display != 62000 /* Magic ID for Emscripten 'default display' */) {
          EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
          return 0;
        }
  
        if (attribList) {
          // read attribList if it is non-null
          for(;;) {
            var param = HEAP32[((attribList)>>2)];
            if (param == 0x3021 /*EGL_ALPHA_SIZE*/) {
              var alphaSize = HEAP32[(((attribList)+(4))>>2)];
              EGL.alpha = (alphaSize > 0);
            } else if (param == 0x3025 /*EGL_DEPTH_SIZE*/) {
              var depthSize = HEAP32[(((attribList)+(4))>>2)];
              EGL.depth = (depthSize > 0);
            } else if (param == 0x3026 /*EGL_STENCIL_SIZE*/) {
              var stencilSize = HEAP32[(((attribList)+(4))>>2)];
              EGL.stencil = (stencilSize > 0);
            } else if (param == 0x3031 /*EGL_SAMPLES*/) {
              var samples = HEAP32[(((attribList)+(4))>>2)];
              EGL.antialias = (samples > 0);
            } else if (param == 0x3032 /*EGL_SAMPLE_BUFFERS*/) {
              var samples = HEAP32[(((attribList)+(4))>>2)];
              EGL.antialias = (samples == 1);
            } else if (param == 0x3038 /*EGL_NONE*/) {
                break;
            }
            attribList += 8;
          }
        }
  
        if ((!config || !config_size) && !numConfigs) {
          EGL.setErrorCode(0x300C /* EGL_BAD_PARAMETER */);
          return 0;
        }
        if (numConfigs) {
          HEAP32[((numConfigs)>>2)]=1; // Total number of supported configs: 1.
        }
        if (config && config_size > 0) {
          HEAP32[((config)>>2)]=62002; 
        }
        
        EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
        return 1;
      }};function _eglGetProcAddress(name_) {
      return _emscripten_GetProcAddress(name_);
    }

  
  
  
  function _emscripten_get_canvas_element_size(target, width, height) {
      var canvas = JSEvents.findCanvasEventTarget(target);
      if (!canvas) return -4;
      HEAP32[((width)>>2)]=canvas.width;
      HEAP32[((height)>>2)]=canvas.height;
    }function __get_canvas_element_size(target) {
      var stackTop = stackSave();
      var w = stackAlloc(8);
      var h = w + 4;
  
      var targetInt = stackAlloc(target.id.length+1);
      stringToUTF8(target.id, targetInt, target.id.length+1);
      var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
      var size = [HEAP32[((w)>>2)], HEAP32[((h)>>2)]];
      stackRestore(stackTop);
      return size;
    }
  
  
  function _emscripten_set_canvas_element_size(target, width, height) {
      var canvas = JSEvents.findCanvasEventTarget(target);
      if (!canvas) return -4;
      canvas.width = width;
      canvas.height = height;
      return 0;
    }function __set_canvas_element_size(target, width, height) {
      if (!target.controlTransferredOffscreen) {
        target.width = width;
        target.height = height;
      } else {
        // This function is being called from high-level JavaScript code instead of asm.js/Wasm,
        // and it needs to synchronously proxy over to another thread, so marshal the string onto the heap to do the call.
        var stackTop = stackSave();
        var targetInt = stackAlloc(target.id.length+1);
        stringToUTF8(target.id, targetInt, target.id.length+1);
        _emscripten_set_canvas_element_size(targetInt, width, height);
        stackRestore(stackTop);
      }
    }var JSEvents={keyEvent:0,mouseEvent:0,wheelEvent:0,uiEvent:0,focusEvent:0,deviceOrientationEvent:0,deviceMotionEvent:0,fullscreenChangeEvent:0,pointerlockChangeEvent:0,visibilityChangeEvent:0,touchEvent:0,lastGamepadState:null,lastGamepadStateFrame:null,numGamepadsConnected:0,previousFullscreenElement:null,previousScreenX:null,previousScreenY:null,removeEventListenersRegistered:false,_onGamepadConnected:function () { ++JSEvents.numGamepadsConnected; },_onGamepadDisconnected:function () { --JSEvents.numGamepadsConnected; },staticInit:function () {
        if (typeof window !== 'undefined') {
          window.addEventListener("gamepadconnected", JSEvents._onGamepadConnected);
          window.addEventListener("gamepaddisconnected", JSEvents._onGamepadDisconnected);
          
          // Chromium does not fire the gamepadconnected event on reload, so we need to get the number of gamepads here as a workaround.
          // See https://bugs.chromium.org/p/chromium/issues/detail?id=502824
          var firstState = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : null);
          if (firstState) {
            JSEvents.numGamepadsConnected = firstState.length;
          }
        }
      },removeAllEventListeners:function () {
        for(var i = JSEvents.eventHandlers.length-1; i >= 0; --i) {
          JSEvents._removeHandler(i);
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = [];
        if (typeof window !== 'undefined') {
          window.removeEventListener("gamepadconnected", JSEvents._onGamepadConnected);
          window.removeEventListener("gamepaddisconnected", JSEvents._onGamepadDisconnected);
        }
      },registerRemoveEventListeners:function () {
        if (!JSEvents.removeEventListenersRegistered) {
          __ATEXIT__.push(JSEvents.removeAllEventListeners);
          JSEvents.removeEventListenersRegistered = true;
        }
      },findEventTarget:function (target) {
        try {
          // The sensible "default" target varies between events, but use window as the default
          // since DOM events mostly can default to that. Specific callback registrations
          // override their own defaults.
          if (!target) return window;
          if (typeof target === "number") target = Pointer_stringify(target);
          if (target === '#window') return window;
          else if (target === '#document') return document;
          else if (target === '#screen') return window.screen;
          else if (target === '#canvas') return Module['canvas'];
          return (typeof target === 'string') ? document.getElementById(target) : target;
        } catch(e) {
          // In Web Workers, some objects above, such as '#document' do not exist. Gracefully
          // return null for them.
          return null;
        }
      },findCanvasEventTarget:function (target) {
        if (typeof target === 'number') target = Pointer_stringify(target);
        if (!target || target === '#canvas') {
          if (typeof GL !== 'undefined' && GL.offscreenCanvases['canvas']) return GL.offscreenCanvases['canvas']; // TODO: Remove this line, target '#canvas' should refer only to Module['canvas'], not to GL.offscreenCanvases['canvas'] - but need stricter tests to be able to remove this line.
          return Module['canvas'];
        }
        if (typeof GL !== 'undefined' && GL.offscreenCanvases[target]) return GL.offscreenCanvases[target];
        return JSEvents.findEventTarget(target);
      },deferredCalls:[],deferCall:function (targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
          if (arrA.length != arrB.length) return false;
  
          for(var i in arrA) {
            if (arrA[i] != arrB[i]) return false;
          }
          return true;
        }
        // Test if the given call was already queued, and if so, don't add it again.
        for(var i in JSEvents.deferredCalls) {
          var call = JSEvents.deferredCalls[i];
          if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
            return;
          }
        }
        JSEvents.deferredCalls.push({
          targetFunction: targetFunction,
          precedence: precedence,
          argsList: argsList
        });
  
        JSEvents.deferredCalls.sort(function(x,y) { return x.precedence < y.precedence; });
      },removeDeferredCalls:function (targetFunction) {
        for(var i = 0; i < JSEvents.deferredCalls.length; ++i) {
          if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
            JSEvents.deferredCalls.splice(i, 1);
            --i;
          }
        }
      },canPerformEventHandlerRequests:function () {
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
      },runDeferredCalls:function () {
        if (!JSEvents.canPerformEventHandlerRequests()) {
          return;
        }
        for(var i = 0; i < JSEvents.deferredCalls.length; ++i) {
          var call = JSEvents.deferredCalls[i];
          JSEvents.deferredCalls.splice(i, 1);
          --i;
          call.targetFunction.apply(this, call.argsList);
        }
      },inEventHandler:0,currentEventHandler:null,eventHandlers:[],isInternetExplorer:function () { return navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0; },removeAllHandlersOnTarget:function (target, eventTypeString) {
        for(var i = 0; i < JSEvents.eventHandlers.length; ++i) {
          if (JSEvents.eventHandlers[i].target == target && 
            (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
             JSEvents._removeHandler(i--);
           }
        }
      },_removeHandler:function (i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1);
      },registerOrRemoveHandler:function (eventHandler) {
        var jsEventHandler = function jsEventHandler(event) {
          // Increment nesting count for the event handler.
          ++JSEvents.inEventHandler;
          JSEvents.currentEventHandler = eventHandler;
          // Process any old deferred calls the user has placed.
          JSEvents.runDeferredCalls();
          // Process the actual event, calls back to user C code handler.
          eventHandler.handlerFunc(event);
          // Process any new deferred calls that were placed right now from this event handler.
          JSEvents.runDeferredCalls();
          // Out of event handler - restore nesting count.
          --JSEvents.inEventHandler;
        }
        
        if (eventHandler.callbackfunc) {
          eventHandler.eventListenerFunc = jsEventHandler;
          eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
          JSEvents.eventHandlers.push(eventHandler);
          JSEvents.registerRemoveEventListeners();
        } else {
          for(var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == eventHandler.target
             && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
               JSEvents._removeHandler(i--);
             }
          }
        }
      },registerKeyEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.keyEvent) JSEvents.keyEvent = _malloc( 164 );
  
        var keyEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var keyEventData = JSEvents.keyEvent;
          stringToUTF8(e.key ? e.key : "", keyEventData + 0, 32);
          stringToUTF8(e.code ? e.code : "", keyEventData + 32, 32);
          HEAP32[(((keyEventData)+(64))>>2)]=e.location;
          HEAP32[(((keyEventData)+(68))>>2)]=e.ctrlKey;
          HEAP32[(((keyEventData)+(72))>>2)]=e.shiftKey;
          HEAP32[(((keyEventData)+(76))>>2)]=e.altKey;
          HEAP32[(((keyEventData)+(80))>>2)]=e.metaKey;
          HEAP32[(((keyEventData)+(84))>>2)]=e.repeat;
          stringToUTF8(e.locale ? e.locale : "", keyEventData + 88, 32);
          stringToUTF8(e.char ? e.char : "", keyEventData + 120, 32);
          HEAP32[(((keyEventData)+(152))>>2)]=e.charCode;
          HEAP32[(((keyEventData)+(156))>>2)]=e.keyCode;
          HEAP32[(((keyEventData)+(160))>>2)]=e.which;
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, keyEventData, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: JSEvents.isInternetExplorer() ? false : true, // MSIE doesn't allow fullscreen and pointerlock requests from key handlers, others do.
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: keyEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },getBoundingClientRectOrZeros:function (target) {
        return target.getBoundingClientRect ? target.getBoundingClientRect() : { left: 0, top: 0 };
      },fillMouseEventData:function (eventStruct, e, target) {
        HEAPF64[((eventStruct)>>3)]=JSEvents.tick();
        HEAP32[(((eventStruct)+(8))>>2)]=e.screenX;
        HEAP32[(((eventStruct)+(12))>>2)]=e.screenY;
        HEAP32[(((eventStruct)+(16))>>2)]=e.clientX;
        HEAP32[(((eventStruct)+(20))>>2)]=e.clientY;
        HEAP32[(((eventStruct)+(24))>>2)]=e.ctrlKey;
        HEAP32[(((eventStruct)+(28))>>2)]=e.shiftKey;
        HEAP32[(((eventStruct)+(32))>>2)]=e.altKey;
        HEAP32[(((eventStruct)+(36))>>2)]=e.metaKey;
        HEAP16[(((eventStruct)+(40))>>1)]=e.button;
        HEAP16[(((eventStruct)+(42))>>1)]=e.buttons;
        HEAP32[(((eventStruct)+(44))>>2)]=e["movementX"] || e["mozMovementX"] || e["webkitMovementX"] || (e.screenX-JSEvents.previousScreenX);
        HEAP32[(((eventStruct)+(48))>>2)]=e["movementY"] || e["mozMovementY"] || e["webkitMovementY"] || (e.screenY-JSEvents.previousScreenY);
  
        if (Module['canvas']) {
          var rect = Module['canvas'].getBoundingClientRect();
          HEAP32[(((eventStruct)+(60))>>2)]=e.clientX - rect.left;
          HEAP32[(((eventStruct)+(64))>>2)]=e.clientY - rect.top;
        } else { // Canvas is not initialized, return 0.
          HEAP32[(((eventStruct)+(60))>>2)]=0;
          HEAP32[(((eventStruct)+(64))>>2)]=0;
        }
        if (target) {
          var rect = JSEvents.getBoundingClientRectOrZeros(target);
          HEAP32[(((eventStruct)+(52))>>2)]=e.clientX - rect.left;
          HEAP32[(((eventStruct)+(56))>>2)]=e.clientY - rect.top;
        } else { // No specific target passed, return 0.
          HEAP32[(((eventStruct)+(52))>>2)]=0;
          HEAP32[(((eventStruct)+(56))>>2)]=0;
        }
        // wheel and mousewheel events contain wrong screenX/screenY on chrome/opera
        // https://github.com/kripken/emscripten/pull/4997
        // https://bugs.chromium.org/p/chromium/issues/detail?id=699956
        if (e.type !== 'wheel' && e.type !== 'mousewheel') {
          JSEvents.previousScreenX = e.screenX;
          JSEvents.previousScreenY = e.screenY;
        }
      },registerMouseEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.mouseEvent) JSEvents.mouseEvent = _malloc( 72 );
        target = JSEvents.findEventTarget(target);
  
        var mouseEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          // TODO: Make this access thread safe, or this could update live while app is reading it.
          JSEvents.fillMouseEventData(JSEvents.mouseEvent, e, target);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: eventTypeString != 'mousemove' && eventTypeString != 'mouseenter' && eventTypeString != 'mouseleave', // Mouse move events do not allow fullscreen/pointer lock requests to be handled in them!
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: mouseEventHandlerFunc,
          useCapture: useCapture
        };
        // In IE, mousedown events don't either allow deferred calls to be run!
        if (JSEvents.isInternetExplorer() && eventTypeString == 'mousedown') eventHandler.allowsDeferredCalls = false;
        JSEvents.registerOrRemoveHandler(eventHandler);
      },registerWheelEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.wheelEvent) JSEvents.wheelEvent = _malloc( 104 );
        target = JSEvents.findEventTarget(target);
  
  
        // The DOM Level 3 events spec event 'wheel'
        var wheelHandlerFunc = function(event) {
          var e = event || window.event;
          var wheelEvent = JSEvents.wheelEvent;
          JSEvents.fillMouseEventData(wheelEvent, e, target);
          HEAPF64[(((wheelEvent)+(72))>>3)]=e["deltaX"];
          HEAPF64[(((wheelEvent)+(80))>>3)]=e["deltaY"];
          HEAPF64[(((wheelEvent)+(88))>>3)]=e["deltaZ"];
          HEAP32[(((wheelEvent)+(96))>>2)]=e["deltaMode"];
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, wheelEvent, userData)) e.preventDefault();
        };
        // The 'mousewheel' event as implemented in Safari 6.0.5
        var mouseWheelHandlerFunc = function(event) {
          var e = event || window.event;
          JSEvents.fillMouseEventData(JSEvents.wheelEvent, e, target);
          HEAPF64[(((JSEvents.wheelEvent)+(72))>>3)]=e["wheelDeltaX"] || 0;
          HEAPF64[(((JSEvents.wheelEvent)+(80))>>3)]=-(e["wheelDeltaY"] ? e["wheelDeltaY"] : e["wheelDelta"]) /* 1. Invert to unify direction with the DOM Level 3 wheel event. 2. MSIE does not provide wheelDeltaY, so wheelDelta is used as a fallback. */;
          HEAPF64[(((JSEvents.wheelEvent)+(88))>>3)]=0 /* Not available */;
          HEAP32[(((JSEvents.wheelEvent)+(96))>>2)]=0 /* DOM_DELTA_PIXEL */;
          var shouldCancel = Module['dynCall_iiii'](callbackfunc, eventTypeId, JSEvents.wheelEvent, userData);
          if (shouldCancel) {
            e.preventDefault();
          }
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: true,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: (eventTypeString == 'wheel') ? wheelHandlerFunc : mouseWheelHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },pageScrollPos:function () {
        if (window.pageXOffset > 0 || window.pageYOffset > 0) {
          return [window.pageXOffset, window.pageYOffset];
        }
        if (typeof document.documentElement.scrollLeft !== 'undefined' || typeof document.documentElement.scrollTop !== 'undefined') {
          return [document.documentElement.scrollLeft, document.documentElement.scrollTop];
        }
        return [document.body.scrollLeft|0, document.body.scrollTop|0];
      },registerUiEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.uiEvent) JSEvents.uiEvent = _malloc( 36 );
  
        if (eventTypeString == "scroll" && !target) {
          target = document; // By default read scroll events on document rather than window.
        } else {
          target = JSEvents.findEventTarget(target);
        }
  
        var uiEventHandlerFunc = function(event) {
          var e = event || window.event;
          if (e.target != target) {
            // Never take ui events such as scroll via a 'bubbled' route, but always from the direct element that
            // was targeted. Otherwise e.g. if app logs a message in response to a page scroll, the Emscripten log
            // message box could cause to scroll, generating a new (bubbled) scroll message, causing a new log print,
            // causing a new scroll, etc..
            return;
          }
          var scrollPos = JSEvents.pageScrollPos();
  
          var uiEvent = JSEvents.uiEvent;
          HEAP32[((uiEvent)>>2)]=e.detail;
          HEAP32[(((uiEvent)+(4))>>2)]=document.body.clientWidth;
          HEAP32[(((uiEvent)+(8))>>2)]=document.body.clientHeight;
          HEAP32[(((uiEvent)+(12))>>2)]=window.innerWidth;
          HEAP32[(((uiEvent)+(16))>>2)]=window.innerHeight;
          HEAP32[(((uiEvent)+(20))>>2)]=window.outerWidth;
          HEAP32[(((uiEvent)+(24))>>2)]=window.outerHeight;
          HEAP32[(((uiEvent)+(28))>>2)]=scrollPos[0];
          HEAP32[(((uiEvent)+(32))>>2)]=scrollPos[1];
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, uiEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false, // Neither scroll or resize events allow running requests inside them.
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: uiEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },getNodeNameForTarget:function (target) {
        if (!target) return '';
        if (target == window) return '#window';
        if (target == window.screen) return '#screen';
        return (target && target.nodeName) ? target.nodeName : '';
      },registerFocusEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.focusEvent) JSEvents.focusEvent = _malloc( 256 );
  
        var focusEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var nodeName = JSEvents.getNodeNameForTarget(e.target);
          var id = e.target.id ? e.target.id : '';
  
          var focusEvent = JSEvents.focusEvent;
          stringToUTF8(nodeName, focusEvent + 0, 128);
          stringToUTF8(id, focusEvent + 128, 128);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, focusEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: focusEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },tick:function () {
        if (window['performance'] && window['performance']['now']) return window['performance']['now']();
        else return Date.now();
      },fillDeviceOrientationEventData:function (eventStruct, e, target) {
        HEAPF64[((eventStruct)>>3)]=JSEvents.tick();
        HEAPF64[(((eventStruct)+(8))>>3)]=e.alpha;
        HEAPF64[(((eventStruct)+(16))>>3)]=e.beta;
        HEAPF64[(((eventStruct)+(24))>>3)]=e.gamma;
        HEAP32[(((eventStruct)+(32))>>2)]=e.absolute;
      },registerDeviceOrientationEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.deviceOrientationEvent) JSEvents.deviceOrientationEvent = _malloc( 40 );
  
        var deviceOrientationEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          JSEvents.fillDeviceOrientationEventData(JSEvents.deviceOrientationEvent, e, target); // TODO: Thread-safety with respect to emscripten_get_deviceorientation_status()
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, JSEvents.deviceOrientationEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: deviceOrientationEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },fillDeviceMotionEventData:function (eventStruct, e, target) {
        HEAPF64[((eventStruct)>>3)]=JSEvents.tick();
        HEAPF64[(((eventStruct)+(8))>>3)]=e.acceleration.x;
        HEAPF64[(((eventStruct)+(16))>>3)]=e.acceleration.y;
        HEAPF64[(((eventStruct)+(24))>>3)]=e.acceleration.z;
        HEAPF64[(((eventStruct)+(32))>>3)]=e.accelerationIncludingGravity.x;
        HEAPF64[(((eventStruct)+(40))>>3)]=e.accelerationIncludingGravity.y;
        HEAPF64[(((eventStruct)+(48))>>3)]=e.accelerationIncludingGravity.z;
        HEAPF64[(((eventStruct)+(56))>>3)]=e.rotationRate.alpha;
        HEAPF64[(((eventStruct)+(64))>>3)]=e.rotationRate.beta;
        HEAPF64[(((eventStruct)+(72))>>3)]=e.rotationRate.gamma;
      },registerDeviceMotionEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.deviceMotionEvent) JSEvents.deviceMotionEvent = _malloc( 80 );
  
        var deviceMotionEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          JSEvents.fillDeviceMotionEventData(JSEvents.deviceMotionEvent, e, target); // TODO: Thread-safety with respect to emscripten_get_devicemotion_status()
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, JSEvents.deviceMotionEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: deviceMotionEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },screenOrientation:function () {
        if (!window.screen) return undefined;
        return window.screen.orientation || window.screen.mozOrientation || window.screen.webkitOrientation || window.screen.msOrientation;
      },fillOrientationChangeEventData:function (eventStruct, e) {
        var orientations  = ["portrait-primary", "portrait-secondary", "landscape-primary", "landscape-secondary"];
        var orientations2 = ["portrait",         "portrait",           "landscape",         "landscape"];
  
        var orientationString = JSEvents.screenOrientation();
        var orientation = orientations.indexOf(orientationString);
        if (orientation == -1) {
          orientation = orientations2.indexOf(orientationString);
        }
  
        HEAP32[((eventStruct)>>2)]=1 << orientation;
        HEAP32[(((eventStruct)+(4))>>2)]=window.orientation;
      },registerOrientationChangeEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.orientationChangeEvent) JSEvents.orientationChangeEvent = _malloc( 8 );
  
        if (!target) {
          target = window.screen; // Orientation events need to be captured from 'window.screen' instead of 'window'
        } else {
          target = JSEvents.findEventTarget(target);
        }
  
        var orientationChangeEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var orientationChangeEvent = JSEvents.orientationChangeEvent;
  
          JSEvents.fillOrientationChangeEventData(orientationChangeEvent, e);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, orientationChangeEvent, userData)) e.preventDefault();
        };
  
        if (eventTypeString == "orientationchange" && window.screen.mozOrientation !== undefined) {
          eventTypeString = "mozorientationchange";
        }
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: orientationChangeEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },fullscreenEnabled:function () {
        return document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled;
      },fillFullscreenChangeEventData:function (eventStruct, e) {
        var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        var isFullscreen = !!fullscreenElement;
        HEAP32[((eventStruct)>>2)]=isFullscreen;
        HEAP32[(((eventStruct)+(4))>>2)]=JSEvents.fullscreenEnabled();
        // If transitioning to fullscreen, report info about the element that is now fullscreen.
        // If transitioning to windowed mode, report info about the element that just was fullscreen.
        var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
        var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
        var id = (reportedElement && reportedElement.id) ? reportedElement.id : '';
        stringToUTF8(nodeName, eventStruct + 8, 128);
        stringToUTF8(id, eventStruct + 136, 128);
        HEAP32[(((eventStruct)+(264))>>2)]=reportedElement ? reportedElement.clientWidth : 0;
        HEAP32[(((eventStruct)+(268))>>2)]=reportedElement ? reportedElement.clientHeight : 0;
        HEAP32[(((eventStruct)+(272))>>2)]=screen.width;
        HEAP32[(((eventStruct)+(276))>>2)]=screen.height;
        if (isFullscreen) {
          JSEvents.previousFullscreenElement = fullscreenElement;
        }
      },registerFullscreenChangeEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.fullscreenChangeEvent) JSEvents.fullscreenChangeEvent = _malloc( 280 );
  
        if (!target) target = document; // Fullscreen change events need to be captured from 'document' by default instead of 'window'
        else target = JSEvents.findEventTarget(target);
  
        var fullscreenChangeEventhandlerFunc = function(event) {
          var e = event || window.event;
  
          var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
  
          JSEvents.fillFullscreenChangeEventData(fullscreenChangeEvent, e);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: fullscreenChangeEventhandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },resizeCanvasForFullscreen:function (target, strategy) {
        var restoreOldStyle = __registerRestoreOldStyle(target);
        var cssWidth = strategy.softFullscreen ? window.innerWidth : screen.width;
        var cssHeight = strategy.softFullscreen ? window.innerHeight : screen.height;
        var rect = target.getBoundingClientRect();
        var windowedCssWidth = rect.right - rect.left;
        var windowedCssHeight = rect.bottom - rect.top;
        var canvasSize = __get_canvas_element_size(target);
        var windowedRttWidth = canvasSize[0];
        var windowedRttHeight = canvasSize[1];
  
        if (strategy.scaleMode == 3) {
          __setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
          cssWidth = windowedCssWidth;
          cssHeight = windowedCssHeight;
        } else if (strategy.scaleMode == 2) {
          if (cssWidth*windowedRttHeight < windowedRttWidth*cssHeight) {
            var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
            __setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
            cssHeight = desiredCssHeight;
          } else {
            var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
            __setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
            cssWidth = desiredCssWidth;
          }
        }
  
        // If we are adding padding, must choose a background color or otherwise Chrome will give the
        // padding a default white color. Do it only if user has not customized their own background color.
        if (!target.style.backgroundColor) target.style.backgroundColor = 'black';
        // IE11 does the same, but requires the color to be set in the document body.
        if (!document.body.style.backgroundColor) document.body.style.backgroundColor = 'black'; // IE11
        // Firefox always shows black letterboxes independent of style color.
  
        target.style.width = cssWidth + 'px';
        target.style.height = cssHeight + 'px';
  
        if (strategy.filteringMode == 1) {
          target.style.imageRendering = 'optimizeSpeed';
          target.style.imageRendering = '-moz-crisp-edges';
          target.style.imageRendering = '-o-crisp-edges';
          target.style.imageRendering = '-webkit-optimize-contrast';
          target.style.imageRendering = 'optimize-contrast';
          target.style.imageRendering = 'crisp-edges';
          target.style.imageRendering = 'pixelated';
        }
  
        var dpiScale = (strategy.canvasResolutionScaleMode == 2) ? window.devicePixelRatio : 1;
        if (strategy.canvasResolutionScaleMode != 0) {
          var newWidth = (cssWidth * dpiScale)|0;
          var newHeight = (cssHeight * dpiScale)|0;
          __set_canvas_element_size(target, newWidth, newHeight);
          if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
        }
        return restoreOldStyle;
      },requestFullscreen:function (target, strategy) {
        // EMSCRIPTEN_FULLSCREEN_SCALE_DEFAULT + EMSCRIPTEN_FULLSCREEN_CANVAS_SCALE_NONE is a mode where no extra logic is performed to the DOM elements.
        if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
          JSEvents.resizeCanvasForFullscreen(target, strategy);
        }
  
        if (target.requestFullscreen) {
          target.requestFullscreen();
        } else if (target.msRequestFullscreen) {
          target.msRequestFullscreen();
        } else if (target.mozRequestFullScreen) {
          target.mozRequestFullScreen();
        } else if (target.mozRequestFullscreen) {
          target.mozRequestFullscreen();
        } else if (target.webkitRequestFullscreen) {
          target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        } else {
          if (typeof JSEvents.fullscreenEnabled() === 'undefined') {
            return -1;
          } else {
            return -3;
          }
        }
  
        if (strategy.canvasResizedCallback) {
          Module['dynCall_iiii'](strategy.canvasResizedCallback, 37, 0, strategy.canvasResizedCallbackUserData);
        }
  
        return 0;
      },fillPointerlockChangeEventData:function (eventStruct, e) {
        var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
        var isPointerlocked = !!pointerLockElement;
        HEAP32[((eventStruct)>>2)]=isPointerlocked;
        var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
        var id = (pointerLockElement && pointerLockElement.id) ? pointerLockElement.id : '';
        stringToUTF8(nodeName, eventStruct + 4, 128);
        stringToUTF8(id, eventStruct + 132, 128);
      },registerPointerlockChangeEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.pointerlockChangeEvent) JSEvents.pointerlockChangeEvent = _malloc( 260 );
  
        if (!target) target = document; // Pointer lock change events need to be captured from 'document' by default instead of 'window'
        else target = JSEvents.findEventTarget(target);
  
        var pointerlockChangeEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var pointerlockChangeEvent = JSEvents.pointerlockChangeEvent;
          JSEvents.fillPointerlockChangeEventData(pointerlockChangeEvent, e);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, pointerlockChangeEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: pointerlockChangeEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },registerPointerlockErrorEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) {
        if (!target) target = document; // Pointer lock events need to be captured from 'document' by default instead of 'window'
        else target = JSEvents.findEventTarget(target);
  
        var pointerlockErrorEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, 0, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: pointerlockErrorEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },requestPointerLock:function (target) {
        if (target.requestPointerLock) {
          target.requestPointerLock();
        } else if (target.mozRequestPointerLock) {
          target.mozRequestPointerLock();
        } else if (target.webkitRequestPointerLock) {
          target.webkitRequestPointerLock();
        } else if (target.msRequestPointerLock) {
          target.msRequestPointerLock();
        } else {
          // document.body is known to accept pointer lock, so use that to differentiate if the user passed a bad element,
          // or if the whole browser just doesn't support the feature.
          if (document.body.requestPointerLock || document.body.mozRequestPointerLock || document.body.webkitRequestPointerLock || document.body.msRequestPointerLock) {
            return -3;
          } else {
            return -1;
          }
        }
        return 0;
      },fillVisibilityChangeEventData:function (eventStruct, e) {
        var visibilityStates = [ "hidden", "visible", "prerender", "unloaded" ];
        var visibilityState = visibilityStates.indexOf(document.visibilityState);
  
        HEAP32[((eventStruct)>>2)]=document.hidden;
        HEAP32[(((eventStruct)+(4))>>2)]=visibilityState;
      },registerVisibilityChangeEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.visibilityChangeEvent) JSEvents.visibilityChangeEvent = _malloc( 8 );
  
        if (!target) target = document; // Visibility change events need to be captured from 'document' by default instead of 'window'
        else target = JSEvents.findEventTarget(target);
  
        var visibilityChangeEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
  
          JSEvents.fillVisibilityChangeEventData(visibilityChangeEvent, e);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, visibilityChangeEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: visibilityChangeEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },registerTouchEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.touchEvent) JSEvents.touchEvent = _malloc( 1684 );
  
        target = JSEvents.findEventTarget(target);
  
        var touchEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var touches = {};
          for(var i = 0; i < e.touches.length; ++i) {
            var touch = e.touches[i];
            touches[touch.identifier] = touch;
          }
          for(var i = 0; i < e.changedTouches.length; ++i) {
            var touch = e.changedTouches[i];
            touches[touch.identifier] = touch;
            touch.changed = true;
          }
          for(var i = 0; i < e.targetTouches.length; ++i) {
            var touch = e.targetTouches[i];
            touches[touch.identifier].onTarget = true;
          }
  
          var touchEvent = JSEvents.touchEvent;
          var ptr = touchEvent;
          HEAP32[(((ptr)+(4))>>2)]=e.ctrlKey;
          HEAP32[(((ptr)+(8))>>2)]=e.shiftKey;
          HEAP32[(((ptr)+(12))>>2)]=e.altKey;
          HEAP32[(((ptr)+(16))>>2)]=e.metaKey;
          ptr += 20; // Advance to the start of the touch array.
          var canvasRect = Module['canvas'] ? Module['canvas'].getBoundingClientRect() : undefined;
          var targetRect = JSEvents.getBoundingClientRectOrZeros(target);
          var numTouches = 0;
          for(var i in touches) {
            var t = touches[i];
            HEAP32[((ptr)>>2)]=t.identifier;
            HEAP32[(((ptr)+(4))>>2)]=t.screenX;
            HEAP32[(((ptr)+(8))>>2)]=t.screenY;
            HEAP32[(((ptr)+(12))>>2)]=t.clientX;
            HEAP32[(((ptr)+(16))>>2)]=t.clientY;
            HEAP32[(((ptr)+(20))>>2)]=t.pageX;
            HEAP32[(((ptr)+(24))>>2)]=t.pageY;
            HEAP32[(((ptr)+(28))>>2)]=t.changed;
            HEAP32[(((ptr)+(32))>>2)]=t.onTarget;
            if (canvasRect) {
              HEAP32[(((ptr)+(44))>>2)]=t.clientX - canvasRect.left;
              HEAP32[(((ptr)+(48))>>2)]=t.clientY - canvasRect.top;
            } else {
              HEAP32[(((ptr)+(44))>>2)]=0;
              HEAP32[(((ptr)+(48))>>2)]=0;            
            }
            HEAP32[(((ptr)+(36))>>2)]=t.clientX - targetRect.left;
            HEAP32[(((ptr)+(40))>>2)]=t.clientY - targetRect.top;
            
            ptr += 52;
  
            if (++numTouches >= 32) {
              break;
            }
          }
          HEAP32[((touchEvent)>>2)]=numTouches;
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, touchEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: eventTypeString == 'touchstart' || eventTypeString == 'touchend',
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: touchEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },fillGamepadEventData:function (eventStruct, e) {
        HEAPF64[((eventStruct)>>3)]=e.timestamp;
        for(var i = 0; i < e.axes.length; ++i) {
          HEAPF64[(((eventStruct+i*8)+(16))>>3)]=e.axes[i];
        }
        for(var i = 0; i < e.buttons.length; ++i) {
          if (typeof(e.buttons[i]) === 'object') {
            HEAPF64[(((eventStruct+i*8)+(528))>>3)]=e.buttons[i].value;
          } else {
            HEAPF64[(((eventStruct+i*8)+(528))>>3)]=e.buttons[i];
          }
        }
        for(var i = 0; i < e.buttons.length; ++i) {
          if (typeof(e.buttons[i]) === 'object') {
            HEAP32[(((eventStruct+i*4)+(1040))>>2)]=e.buttons[i].pressed;
          } else {
            HEAP32[(((eventStruct+i*4)+(1040))>>2)]=e.buttons[i] == 1.0;
          }
        }
        HEAP32[(((eventStruct)+(1296))>>2)]=e.connected;
        HEAP32[(((eventStruct)+(1300))>>2)]=e.index;
        HEAP32[(((eventStruct)+(8))>>2)]=e.axes.length;
        HEAP32[(((eventStruct)+(12))>>2)]=e.buttons.length;
        stringToUTF8(e.id, eventStruct + 1304, 64);
        stringToUTF8(e.mapping, eventStruct + 1368, 64);
      },registerGamepadEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.gamepadEvent) JSEvents.gamepadEvent = _malloc( 1432 );
  
        var gamepadEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var gamepadEvent = JSEvents.gamepadEvent;
          JSEvents.fillGamepadEventData(gamepadEvent, e.gamepad);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, gamepadEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: true,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: gamepadEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },registerBeforeUnloadEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) {
        var beforeUnloadEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          // Note: This is always called on the main browser thread, since it needs synchronously return a value!
          var confirmationMessage = Module['dynCall_iiii'](callbackfunc, eventTypeId, 0, userData);
          
          if (confirmationMessage) {
            confirmationMessage = Pointer_stringify(confirmationMessage);
          }
          if (confirmationMessage) {
            e.preventDefault();
            e.returnValue = confirmationMessage;
            return confirmationMessage;
          }
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: beforeUnloadEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },battery:function () { return navigator.battery || navigator.mozBattery || navigator.webkitBattery; },fillBatteryEventData:function (eventStruct, e) {
        HEAPF64[((eventStruct)>>3)]=e.chargingTime;
        HEAPF64[(((eventStruct)+(8))>>3)]=e.dischargingTime;
        HEAPF64[(((eventStruct)+(16))>>3)]=e.level;
        HEAP32[(((eventStruct)+(24))>>2)]=e.charging;
      },registerBatteryEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.batteryEvent) JSEvents.batteryEvent = _malloc( 32 );
  
        var batteryEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var batteryEvent = JSEvents.batteryEvent;
          JSEvents.fillBatteryEventData(batteryEvent, JSEvents.battery());
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, batteryEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: batteryEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },registerWebGlEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!target) target = Module['canvas'];
  
        var webGlEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, 0, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: webGlEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      }};function _emscripten_exit_pointerlock() {
      // Make sure no queued up calls will fire after this.
      JSEvents.removeDeferredCalls(JSEvents.requestPointerLock);
  
      if (document.exitPointerLock) {
        document.exitPointerLock();
      } else if (document.msExitPointerLock) {
        document.msExitPointerLock();
      } else if (document.mozExitPointerLock) {
        document.mozExitPointerLock();
      } else if (document.webkitExitPointerLock) {
        document.webkitExitPointerLock();
      } else {
        return -1;
      }
      return 0;
    }

  
  function __emscripten_sample_gamepad_data() {
      // Polling gamepads generates garbage, so don't do it when we know there are no gamepads connected.
      if (!JSEvents.numGamepadsConnected) return;
  
      // Produce a new Gamepad API sample if we are ticking a new game frame, or if not using emscripten_set_main_loop() at all to drive animation.
      if (Browser.mainLoop.currentFrameNumber !== JSEvents.lastGamepadStateFrame || !Browser.mainLoop.currentFrameNumber) {
        JSEvents.lastGamepadState = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : null);
        JSEvents.lastGamepadStateFrame = Browser.mainLoop.currentFrameNumber;
      }
    }function _emscripten_get_gamepad_status(index, gamepadState) {
      __emscripten_sample_gamepad_data();
      if (!JSEvents.lastGamepadState) return -1;
  
      // INVALID_PARAM is returned on a Gamepad index that never was there.
      if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
  
      // NO_DATA is returned on a Gamepad index that was removed.
      // For previously disconnected gamepads there should be an empty slot (null/undefined/false) at the index.
      // This is because gamepads must keep their original position in the array.
      // For example, removing the first of two gamepads produces [null/undefined/false, gamepad].
      if (!JSEvents.lastGamepadState[index]) return -7;
  
      JSEvents.fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
      return 0;
    }

  function _emscripten_get_num_gamepads() {
      // Polling gamepads generates garbage, so don't do it when we know there are no gamepads connected.
      if (!JSEvents.numGamepadsConnected) return 0;
  
      __emscripten_sample_gamepad_data();
      if (!JSEvents.lastGamepadState) return -1;
      return JSEvents.lastGamepadState.length;
    }

  function _emscripten_get_pointerlock_status(pointerlockStatus) {
      if (pointerlockStatus) JSEvents.fillPointerlockChangeEventData(pointerlockStatus);
      if (!document.body || (!document.body.requestPointerLock && !document.body.mozRequestPointerLock && !document.body.webkitRequestPointerLock && !document.body.msRequestPointerLock)) {
        return -1;
      }
      return 0;
    }

  function _emscripten_glAccum() {
  err('missing function: emscripten_glAccum'); abort(-1);
  }

  
  var GL={counter:1,lastError:0,buffers:[],mappedBuffers:{},programs:[],framebuffers:[],renderbuffers:[],textures:[],uniforms:[],shaders:[],vaos:[],contexts:{},currentContext:null,offscreenCanvases:{},timerQueriesEXT:[],byteSizeByTypeRoot:5120,byteSizeByType:[1,1,2,2,4,4,4,2,3,4,8],programInfos:{},stringCache:{},tempFixedLengthArray:[],packAlignment:4,unpackAlignment:4,init:function () {
        GL.miniTempBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
        for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
          GL.miniTempBufferViews[i] = GL.miniTempBuffer.subarray(0, i+1);
        }
  
        // For functions such as glDrawBuffers, glInvalidateFramebuffer and glInvalidateSubFramebuffer that need to pass a short array to the WebGL API,
        // create a set of short fixed-length arrays to avoid having to generate any garbage when calling those functions.
        for (var i = 0; i < 32; i++) {
          GL.tempFixedLengthArray.push(new Array(i));
        }
      },recordError:function recordError(errorCode) {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },getNewId:function (table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        return ret;
      },MINI_TEMP_BUFFER_SIZE:256,miniTempBuffer:null,miniTempBufferViews:[0],getSource:function (shader, count, string, length) {
        var source = '';
        for (var i = 0; i < count; ++i) {
          var frag;
          if (length) {
            var len = HEAP32[(((length)+(i*4))>>2)];
            if (len < 0) {
              frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)]);
            } else {
              frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)], len);
            }
          } else {
            frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)]);
          }
          source += frag;
        }
        return source;
      },createContext:function (canvas, webGLContextAttributes) {
        if (typeof webGLContextAttributes['majorVersion'] === 'undefined' && typeof webGLContextAttributes['minorVersion'] === 'undefined') {
          webGLContextAttributes['majorVersion'] = 1;
          webGLContextAttributes['minorVersion'] = 0;
        }
  
  
  
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
          try {
            if (webGLContextAttributes['majorVersion'] == 1 && webGLContextAttributes['minorVersion'] == 0) {
              ctx = canvas.getContext("webgl", webGLContextAttributes) || canvas.getContext("experimental-webgl", webGLContextAttributes);
            } else if (webGLContextAttributes['majorVersion'] == 2 && webGLContextAttributes['minorVersion'] == 0) {
              ctx = canvas.getContext("webgl2", webGLContextAttributes);
            } else {
              throw 'Unsupported WebGL context version ' + majorVersion + '.' + minorVersion + '!'
            }
          } finally {
            canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
          }
          if (!ctx) throw ':(';
        } catch (e) {
          return 0;
        }
  
        if (!ctx) return 0;
        var context = GL.registerContext(ctx, webGLContextAttributes);
        return context;
      },registerContext:function (ctx, webGLContextAttributes) {
        var handle = _malloc(8); // Make space on the heap to store GL context attributes that need to be accessible as shared between threads.
        HEAP32[((handle)>>2)]=webGLContextAttributes["explicitSwapControl"]; // explicitSwapControl
        var context = {
          handle: handle,
          attributes: webGLContextAttributes,
          version: webGLContextAttributes['majorVersion'],
          GLctx: ctx
        };
  
  
  
        // Store the created context object so that we can access the context given a canvas without having to pass the parameters again.
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes['enableExtensionsByDefault'] === 'undefined' || webGLContextAttributes['enableExtensionsByDefault']) {
          GL.initExtensions(context);
        }
  
  
  
  
        return handle;
      },makeContextCurrent:function (contextHandle) {
        // Deactivating current context?
        if (!contextHandle) {
          GLctx = Module.ctx = GL.currentContext = null;
          return true;
        }
        var context = GL.contexts[contextHandle];
        if (!context) {
          return false;
        }
        GLctx = Module.ctx = context.GLctx; // Active WebGL context object.
        GL.currentContext = context; // Active Emscripten GL layer context object.
        return true;
      },getContext:function (contextHandle) {
        return GL.contexts[contextHandle];
      },deleteContext:function (contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if (typeof JSEvents === 'object') JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas); // Release all JS event handlers on the DOM element that the GL context is associated with since the context is now deleted.
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined; // Make sure the canvas object no longer refers to the context object so there are no GC surprises.
        _free(GL.contexts[contextHandle]);
        GL.contexts[contextHandle] = null;
      },initExtensions:function (context) {
        // If this function is called without a specific context object, init the extensions of the currently active context.
        if (!context) context = GL.currentContext;
  
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
  
        var GLctx = context.GLctx;
  
        // Detect the presence of a few extensions manually, this GL interop layer itself will need to know if they exist.
  
        if (context.version < 2) {
          // Extension available from Firefox 26 and Google Chrome 30
          var instancedArraysExt = GLctx.getExtension('ANGLE_instanced_arrays');
          if (instancedArraysExt) {
            GLctx['vertexAttribDivisor'] = function(index, divisor) { instancedArraysExt['vertexAttribDivisorANGLE'](index, divisor); };
            GLctx['drawArraysInstanced'] = function(mode, first, count, primcount) { instancedArraysExt['drawArraysInstancedANGLE'](mode, first, count, primcount); };
            GLctx['drawElementsInstanced'] = function(mode, count, type, indices, primcount) { instancedArraysExt['drawElementsInstancedANGLE'](mode, count, type, indices, primcount); };
          }
  
          // Extension available from Firefox 25 and WebKit
          var vaoExt = GLctx.getExtension('OES_vertex_array_object');
          if (vaoExt) {
            GLctx['createVertexArray'] = function() { return vaoExt['createVertexArrayOES'](); };
            GLctx['deleteVertexArray'] = function(vao) { vaoExt['deleteVertexArrayOES'](vao); };
            GLctx['bindVertexArray'] = function(vao) { vaoExt['bindVertexArrayOES'](vao); };
            GLctx['isVertexArray'] = function(vao) { return vaoExt['isVertexArrayOES'](vao); };
          }
  
          var drawBuffersExt = GLctx.getExtension('WEBGL_draw_buffers');
          if (drawBuffersExt) {
            GLctx['drawBuffers'] = function(n, bufs) { drawBuffersExt['drawBuffersWEBGL'](n, bufs); };
          }
        }
  
        GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
  
        // These are the 'safe' feature-enabling extensions that don't add any performance impact related to e.g. debugging, and
        // should be enabled by default so that client GLES2/GL code will not need to go through extra hoops to get its stuff working.
        // As new extensions are ratified at http://www.khronos.org/registry/webgl/extensions/ , feel free to add your new extensions
        // here, as long as they don't produce a performance impact for users that might not be using those extensions.
        // E.g. debugging-related extensions should probably be off by default.
        var automaticallyEnabledExtensions = [ // Khronos ratified WebGL extensions ordered by number (no debug extensions):
                                               "OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives",
                                               "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture",
                                               "OES_element_index_uint", "EXT_texture_filter_anisotropic", "EXT_frag_depth",
                                               "WEBGL_draw_buffers", "ANGLE_instanced_arrays", "OES_texture_float_linear",
                                               "OES_texture_half_float_linear", "EXT_blend_minmax", "EXT_shader_texture_lod",
                                               // Community approved WebGL extensions ordered by number:
                                               "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float",
                                               "EXT_sRGB", "WEBGL_compressed_texture_etc1", "EXT_disjoint_timer_query",
                                               "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_astc", "EXT_color_buffer_float",
                                               "WEBGL_compressed_texture_s3tc_srgb", "EXT_disjoint_timer_query_webgl2"];
  
        function shouldEnableAutomatically(extension) {
          var ret = false;
          automaticallyEnabledExtensions.forEach(function(include) {
            if (extension.indexOf(include) != -1) {
              ret = true;
            }
          });
          return ret;
        }
  
        var exts = GLctx.getSupportedExtensions();
        if (exts && exts.length > 0) {
          GLctx.getSupportedExtensions().forEach(function(ext) {
            if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
              GLctx.getExtension(ext); // Calling .getExtension enables that extension permanently, no need to store the return value to be enabled.
            }
          });
        }
      },populateUniformTable:function (program) {
        var p = GL.programs[program];
        GL.programInfos[program] = {
          uniforms: {},
          maxUniformLength: 0, // This is eagerly computed below, since we already enumerate all uniforms anyway.
          maxAttributeLength: -1, // This is lazily computed and cached, computed when/if first asked, "-1" meaning not computed yet.
          maxUniformBlockNameLength: -1 // Lazily computed as well
        };
  
        var ptable = GL.programInfos[program];
        var utable = ptable.uniforms;
        // A program's uniform table maps the string name of an uniform to an integer location of that uniform.
        // The global GL.uniforms map maps integer locations to WebGLUniformLocations.
        var numUniforms = GLctx.getProgramParameter(p, GLctx.ACTIVE_UNIFORMS);
        for (var i = 0; i < numUniforms; ++i) {
          var u = GLctx.getActiveUniform(p, i);
  
          var name = u.name;
          ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length+1);
  
          // Strip off any trailing array specifier we might have got, e.g. "[0]".
          if (name.indexOf(']', name.length-1) !== -1) {
            var ls = name.lastIndexOf('[');
            name = name.slice(0, ls);
          }
  
          // Optimize memory usage slightly: If we have an array of uniforms, e.g. 'vec3 colors[3];', then
          // only store the string 'colors' in utable, and 'colors[0]', 'colors[1]' and 'colors[2]' will be parsed as 'colors'+i.
          // Note that for the GL.uniforms table, we still need to fetch the all WebGLUniformLocations for all the indices.
          var loc = GLctx.getUniformLocation(p, name);
          if (loc != null)
          {
            var id = GL.getNewId(GL.uniforms);
            utable[name] = [u.size, id];
            GL.uniforms[id] = loc;
  
            for (var j = 1; j < u.size; ++j) {
              var n = name + '['+j+']';
              loc = GLctx.getUniformLocation(p, n);
              id = GL.getNewId(GL.uniforms);
  
              GL.uniforms[id] = loc;
            }
          }
        }
      }};function _emscripten_glActiveTexture(x0) { GLctx['activeTexture'](x0) }

  function _emscripten_glAlphaFunc() {
  err('missing function: emscripten_glAlphaFunc'); abort(-1);
  }

  function _emscripten_glAreTexturesResident() {
  err('missing function: emscripten_glAreTexturesResident'); abort(-1);
  }

  function _emscripten_glArrayElement() {
  err('missing function: emscripten_glArrayElement'); abort(-1);
  }

  function _emscripten_glAttachObjectARB() {
  err('missing function: emscripten_glAttachObjectARB'); abort(-1);
  }

  function _emscripten_glAttachShader(program, shader) {
      GLctx.attachShader(GL.programs[program],
                              GL.shaders[shader]);
    }

  function _emscripten_glBegin(){ throw 'Legacy GL function (glBegin) called. If you want legacy GL emulation, you need to compile with -s LEGACY_GL_EMULATION=1 to enable legacy GL emulation.'; }

  function _emscripten_glBeginConditionalRender() {
  err('missing function: emscripten_glBeginConditionalRender'); abort(-1);
  }

  function _emscripten_glBeginQuery() {
  err('missing function: emscripten_glBeginQuery'); abort(-1);
  }

  function _emscripten_glBeginTransformFeedback() {
  err('missing function: emscripten_glBeginTransformFeedback'); abort(-1);
  }

  function _emscripten_glBindAttribLocation(program, index, name) {
      name = Pointer_stringify(name);
      GLctx.bindAttribLocation(GL.programs[program], index, name);
    }

  function _emscripten_glBindBuffer(target, buffer) {
      var bufferObj = buffer ? GL.buffers[buffer] : null;
  
  
      GLctx.bindBuffer(target, bufferObj);
    }

  function _emscripten_glBindBufferBase() {
  err('missing function: emscripten_glBindBufferBase'); abort(-1);
  }

  function _emscripten_glBindBufferRange() {
  err('missing function: emscripten_glBindBufferRange'); abort(-1);
  }

  function _emscripten_glBindFragDataLocation() {
  err('missing function: emscripten_glBindFragDataLocation'); abort(-1);
  }

  function _emscripten_glBindFramebuffer(target, framebuffer) {
  
      GLctx.bindFramebuffer(target, framebuffer ? GL.framebuffers[framebuffer] : null);
  
    }

  function _emscripten_glBindProgramARB() {
  err('missing function: emscripten_glBindProgramARB'); abort(-1);
  }

  function _emscripten_glBindRenderbuffer(target, renderbuffer) {
      GLctx.bindRenderbuffer(target, renderbuffer ? GL.renderbuffers[renderbuffer] : null);
    }

  function _emscripten_glBindTexture(target, texture) {
      GLctx.bindTexture(target, texture ? GL.textures[texture] : null);
    }

  function _emscripten_glBindVertexArray(vao) {
      GLctx['bindVertexArray'](GL.vaos[vao]);
    }

  function _emscripten_glBitmap() {
  err('missing function: emscripten_glBitmap'); abort(-1);
  }

  function _emscripten_glBlendColor(x0, x1, x2, x3) { GLctx['blendColor'](x0, x1, x2, x3) }

  function _emscripten_glBlendEquation(x0) { GLctx['blendEquation'](x0) }

  function _emscripten_glBlendEquationSeparate(x0, x1) { GLctx['blendEquationSeparate'](x0, x1) }

  function _emscripten_glBlendFunc(x0, x1) { GLctx['blendFunc'](x0, x1) }

  function _emscripten_glBlendFuncSeparate(x0, x1, x2, x3) { GLctx['blendFuncSeparate'](x0, x1, x2, x3) }

  function _emscripten_glBlitFramebuffer() {
  err('missing function: emscripten_glBlitFramebuffer'); abort(-1);
  }

  function _emscripten_glBufferData(target, size, data, usage) {
      if (!data) {
        GLctx.bufferData(target, size, usage);
      } else {
        GLctx.bufferData(target, HEAPU8.subarray(data, data+size), usage);
      }
    }

  function _emscripten_glBufferSubData(target, offset, size, data) {
      GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data+size));
    }

  function _emscripten_glCallList() {
  err('missing function: emscripten_glCallList'); abort(-1);
  }

  function _emscripten_glCallLists() {
  err('missing function: emscripten_glCallLists'); abort(-1);
  }

  function _emscripten_glCheckFramebufferStatus(x0) { return GLctx['checkFramebufferStatus'](x0) }

  function _emscripten_glClampColor() {
  err('missing function: emscripten_glClampColor'); abort(-1);
  }

  function _emscripten_glClear(x0) { GLctx['clear'](x0) }

  function _emscripten_glClearAccum() {
  err('missing function: emscripten_glClearAccum'); abort(-1);
  }

  function _emscripten_glClearBufferfi() {
  err('missing function: emscripten_glClearBufferfi'); abort(-1);
  }

  function _emscripten_glClearBufferfv() {
  err('missing function: emscripten_glClearBufferfv'); abort(-1);
  }

  function _emscripten_glClearBufferiv() {
  err('missing function: emscripten_glClearBufferiv'); abort(-1);
  }

  function _emscripten_glClearBufferuiv() {
  err('missing function: emscripten_glClearBufferuiv'); abort(-1);
  }

  function _emscripten_glClearColor(x0, x1, x2, x3) { GLctx['clearColor'](x0, x1, x2, x3) }

  function _emscripten_glClearDepth(x0) { GLctx['clearDepth'](x0) }

  function _emscripten_glClearDepthf(x0) { GLctx['clearDepth'](x0) }

  function _emscripten_glClearIndex() {
  err('missing function: emscripten_glClearIndex'); abort(-1);
  }

  function _emscripten_glClearStencil(x0) { GLctx['clearStencil'](x0) }

  function _emscripten_glClientActiveTexture() {
  err('missing function: emscripten_glClientActiveTexture'); abort(-1);
  }

  function _emscripten_glClipPlane() {
  err('missing function: emscripten_glClipPlane'); abort(-1);
  }

  function _emscripten_glColor3b() {
  err('missing function: emscripten_glColor3b'); abort(-1);
  }

  function _emscripten_glColor3bv() {
  err('missing function: emscripten_glColor3bv'); abort(-1);
  }

  function _emscripten_glColor3d() {
  err('missing function: emscripten_glColor3d'); abort(-1);
  }

  function _emscripten_glColor3dv() {
  err('missing function: emscripten_glColor3dv'); abort(-1);
  }

  function _emscripten_glColor3f() {
  err('missing function: emscripten_glColor3f'); abort(-1);
  }

  function _emscripten_glColor3fv() {
  err('missing function: emscripten_glColor3fv'); abort(-1);
  }

  function _emscripten_glColor3i() {
  err('missing function: emscripten_glColor3i'); abort(-1);
  }

  function _emscripten_glColor3iv() {
  err('missing function: emscripten_glColor3iv'); abort(-1);
  }

  function _emscripten_glColor3s() {
  err('missing function: emscripten_glColor3s'); abort(-1);
  }

  function _emscripten_glColor3sv() {
  err('missing function: emscripten_glColor3sv'); abort(-1);
  }

  function _emscripten_glColor3ub() {
  err('missing function: emscripten_glColor3ub'); abort(-1);
  }

  function _emscripten_glColor3ubv() {
  err('missing function: emscripten_glColor3ubv'); abort(-1);
  }

  function _emscripten_glColor3ui() {
  err('missing function: emscripten_glColor3ui'); abort(-1);
  }

  function _emscripten_glColor3uiv() {
  err('missing function: emscripten_glColor3uiv'); abort(-1);
  }

  function _emscripten_glColor3us() {
  err('missing function: emscripten_glColor3us'); abort(-1);
  }

  function _emscripten_glColor3usv() {
  err('missing function: emscripten_glColor3usv'); abort(-1);
  }

  function _emscripten_glColor4b() {
  err('missing function: emscripten_glColor4b'); abort(-1);
  }

  function _emscripten_glColor4bv() {
  err('missing function: emscripten_glColor4bv'); abort(-1);
  }

  function _emscripten_glColor4d() {
  err('missing function: emscripten_glColor4d'); abort(-1);
  }

  function _emscripten_glColor4dv() {
  err('missing function: emscripten_glColor4dv'); abort(-1);
  }

  function _emscripten_glColor4f() {
  err('missing function: emscripten_glColor4f'); abort(-1);
  }

  function _emscripten_glColor4fv() {
  err('missing function: emscripten_glColor4fv'); abort(-1);
  }

  function _emscripten_glColor4i() {
  err('missing function: emscripten_glColor4i'); abort(-1);
  }

  function _emscripten_glColor4iv() {
  err('missing function: emscripten_glColor4iv'); abort(-1);
  }

  function _emscripten_glColor4s() {
  err('missing function: emscripten_glColor4s'); abort(-1);
  }

  function _emscripten_glColor4sv() {
  err('missing function: emscripten_glColor4sv'); abort(-1);
  }

  function _emscripten_glColor4ub() {
  err('missing function: emscripten_glColor4ub'); abort(-1);
  }

  function _emscripten_glColor4ubv() {
  err('missing function: emscripten_glColor4ubv'); abort(-1);
  }

  function _emscripten_glColor4ui() {
  err('missing function: emscripten_glColor4ui'); abort(-1);
  }

  function _emscripten_glColor4uiv() {
  err('missing function: emscripten_glColor4uiv'); abort(-1);
  }

  function _emscripten_glColor4us() {
  err('missing function: emscripten_glColor4us'); abort(-1);
  }

  function _emscripten_glColor4usv() {
  err('missing function: emscripten_glColor4usv'); abort(-1);
  }

  function _emscripten_glColorMask(red, green, blue, alpha) {
      GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
    }

  function _emscripten_glColorMaski() {
  err('missing function: emscripten_glColorMaski'); abort(-1);
  }

  function _emscripten_glColorMaterial() {
  err('missing function: emscripten_glColorMaterial'); abort(-1);
  }

  function _emscripten_glColorPointer() {
  err('missing function: emscripten_glColorPointer'); abort(-1);
  }

  function _emscripten_glColorSubTable() {
  err('missing function: emscripten_glColorSubTable'); abort(-1);
  }

  function _emscripten_glColorTable() {
  err('missing function: emscripten_glColorTable'); abort(-1);
  }

  function _emscripten_glColorTableParameterfv() {
  err('missing function: emscripten_glColorTableParameterfv'); abort(-1);
  }

  function _emscripten_glColorTableParameteriv() {
  err('missing function: emscripten_glColorTableParameteriv'); abort(-1);
  }

  function _emscripten_glCompileShader(shader) {
      GLctx.compileShader(GL.shaders[shader]);
    }

  function _emscripten_glCompressedTexImage1D() {
  err('missing function: emscripten_glCompressedTexImage1D'); abort(-1);
  }

  function _emscripten_glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
      GLctx['compressedTexImage2D'](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray((data),(data+imageSize)) : null);
    }

  function _emscripten_glCompressedTexImage3D() {
  err('missing function: emscripten_glCompressedTexImage3D'); abort(-1);
  }

  function _emscripten_glCompressedTexSubImage1D() {
  err('missing function: emscripten_glCompressedTexSubImage1D'); abort(-1);
  }

  function _emscripten_glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
      GLctx['compressedTexSubImage2D'](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray((data),(data+imageSize)) : null);
    }

  function _emscripten_glCompressedTexSubImage3D() {
  err('missing function: emscripten_glCompressedTexSubImage3D'); abort(-1);
  }

  function _emscripten_glConvolutionFilter1D() {
  err('missing function: emscripten_glConvolutionFilter1D'); abort(-1);
  }

  function _emscripten_glConvolutionFilter2D() {
  err('missing function: emscripten_glConvolutionFilter2D'); abort(-1);
  }

  function _emscripten_glConvolutionParameterf() {
  err('missing function: emscripten_glConvolutionParameterf'); abort(-1);
  }

  function _emscripten_glConvolutionParameterfv() {
  err('missing function: emscripten_glConvolutionParameterfv'); abort(-1);
  }

  function _emscripten_glConvolutionParameteri() {
  err('missing function: emscripten_glConvolutionParameteri'); abort(-1);
  }

  function _emscripten_glConvolutionParameteriv() {
  err('missing function: emscripten_glConvolutionParameteriv'); abort(-1);
  }

  function _emscripten_glCopyColorSubTable() {
  err('missing function: emscripten_glCopyColorSubTable'); abort(-1);
  }

  function _emscripten_glCopyColorTable() {
  err('missing function: emscripten_glCopyColorTable'); abort(-1);
  }

  function _emscripten_glCopyConvolutionFilter1D() {
  err('missing function: emscripten_glCopyConvolutionFilter1D'); abort(-1);
  }

  function _emscripten_glCopyConvolutionFilter2D() {
  err('missing function: emscripten_glCopyConvolutionFilter2D'); abort(-1);
  }

  function _emscripten_glCopyPixels() {
  err('missing function: emscripten_glCopyPixels'); abort(-1);
  }

  function _emscripten_glCopyTexImage1D() {
  err('missing function: emscripten_glCopyTexImage1D'); abort(-1);
  }

  function _emscripten_glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) { GLctx['copyTexImage2D'](x0, x1, x2, x3, x4, x5, x6, x7) }

  function _emscripten_glCopyTexSubImage1D() {
  err('missing function: emscripten_glCopyTexSubImage1D'); abort(-1);
  }

  function _emscripten_glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) { GLctx['copyTexSubImage2D'](x0, x1, x2, x3, x4, x5, x6, x7) }

  function _emscripten_glCopyTexSubImage3D() {
  err('missing function: emscripten_glCopyTexSubImage3D'); abort(-1);
  }

  function _emscripten_glCreateProgram() {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      program.name = id;
      GL.programs[id] = program;
      return id;
    }

  function _emscripten_glCreateProgramObjectARB() {
  err('missing function: emscripten_glCreateProgramObjectARB'); abort(-1);
  }

  function _emscripten_glCreateShader(shaderType) {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
      return id;
    }

  function _emscripten_glCreateShaderObjectARB() {
  err('missing function: emscripten_glCreateShaderObjectARB'); abort(-1);
  }

  function _emscripten_glCullFace(x0) { GLctx['cullFace'](x0) }

  function _emscripten_glDeleteBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((buffers)+(i*4))>>2)];
        var buffer = GL.buffers[id];
  
        // From spec: "glDeleteBuffers silently ignores 0's and names that do not
        // correspond to existing buffer objects."
        if (!buffer) continue;
  
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
  
        if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
        if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
      }
    }

  function _emscripten_glDeleteFramebuffers(n, framebuffers) {
      for (var i = 0; i < n; ++i) {
        var id = HEAP32[(((framebuffers)+(i*4))>>2)];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue; // GL spec: "glDeleteFramebuffers silently ignores 0s and names that do not correspond to existing framebuffer objects".
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null;
      }
    }

  function _emscripten_glDeleteLists() {
  err('missing function: emscripten_glDeleteLists'); abort(-1);
  }

  function _emscripten_glDeleteObjectARB() {
  err('missing function: emscripten_glDeleteObjectARB'); abort(-1);
  }

  function _emscripten_glDeleteProgram(id) {
      if (!id) return;
      var program = GL.programs[id];
      if (!program) { // glDeleteProgram actually signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
      GL.programInfos[id] = null;
    }

  function _emscripten_glDeleteProgramsARB() {
  err('missing function: emscripten_glDeleteProgramsARB'); abort(-1);
  }

  function _emscripten_glDeleteQueries() {
  err('missing function: emscripten_glDeleteQueries'); abort(-1);
  }

  function _emscripten_glDeleteRenderbuffers(n, renderbuffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((renderbuffers)+(i*4))>>2)];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue; // GL spec: "glDeleteRenderbuffers silently ignores 0s and names that do not correspond to existing renderbuffer objects".
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null;
      }
    }

  function _emscripten_glDeleteShader(id) {
      if (!id) return;
      var shader = GL.shaders[id];
      if (!shader) { // glDeleteShader actually signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    }

  function _emscripten_glDeleteTextures(n, textures) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((textures)+(i*4))>>2)];
        var texture = GL.textures[id];
        if (!texture) continue; // GL spec: "glDeleteTextures silently ignores 0s and names that do not correspond to existing textures".
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
      }
    }

  function _emscripten_glDeleteVertexArrays(n, vaos) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((vaos)+(i*4))>>2)];
        GLctx['deleteVertexArray'](GL.vaos[id]);
        GL.vaos[id] = null;
      }
    }

  function _emscripten_glDepthFunc(x0) { GLctx['depthFunc'](x0) }

  function _emscripten_glDepthMask(flag) {
      GLctx.depthMask(!!flag);
    }

  function _emscripten_glDepthRange(x0, x1) { GLctx['depthRange'](x0, x1) }

  function _emscripten_glDepthRangef(x0, x1) { GLctx['depthRange'](x0, x1) }

  function _emscripten_glDetachObjectARB() {
  err('missing function: emscripten_glDetachObjectARB'); abort(-1);
  }

  function _emscripten_glDetachShader(program, shader) {
      GLctx.detachShader(GL.programs[program],
                              GL.shaders[shader]);
    }

  function _emscripten_glDisable(x0) { GLctx['disable'](x0) }

  function _emscripten_glDisableClientState() {
  err('missing function: emscripten_glDisableClientState'); abort(-1);
  }

  function _emscripten_glDisableVertexAttribArray(index) {
      GLctx.disableVertexAttribArray(index);
    }

  function _emscripten_glDisablei() {
  err('missing function: emscripten_glDisablei'); abort(-1);
  }

  function _emscripten_glDrawArrays(mode, first, count) {
  
      GLctx.drawArrays(mode, first, count);
  
    }

  function _emscripten_glDrawArraysInstanced(mode, first, count, primcount) {
      GLctx['drawArraysInstanced'](mode, first, count, primcount);
    }

  function _emscripten_glDrawBuffer() {
  err('missing function: emscripten_glDrawBuffer'); abort(-1);
  }

  function _emscripten_glDrawBuffers(n, bufs) {
  
      var bufArray = GL.tempFixedLengthArray[n];
      for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(((bufs)+(i*4))>>2)];
      }
  
      GLctx['drawBuffers'](bufArray);
    }

  function _emscripten_glDrawElements(mode, count, type, indices) {
  
      GLctx.drawElements(mode, count, type, indices);
  
    }

  function _emscripten_glDrawElementsInstanced(mode, count, type, indices, primcount) {
      GLctx['drawElementsInstanced'](mode, count, type, indices, primcount);
    }

  function _emscripten_glDrawPixels() {
  err('missing function: emscripten_glDrawPixels'); abort(-1);
  }

  function _emscripten_glDrawRangeElements() {
  err('missing function: emscripten_glDrawRangeElements'); abort(-1);
  }

  function _emscripten_glEdgeFlag() {
  err('missing function: emscripten_glEdgeFlag'); abort(-1);
  }

  function _emscripten_glEdgeFlagPointer() {
  err('missing function: emscripten_glEdgeFlagPointer'); abort(-1);
  }

  function _emscripten_glEdgeFlagv() {
  err('missing function: emscripten_glEdgeFlagv'); abort(-1);
  }

  function _emscripten_glEnable(x0) { GLctx['enable'](x0) }

  function _emscripten_glEnableClientState() {
  err('missing function: emscripten_glEnableClientState'); abort(-1);
  }

  function _emscripten_glEnableVertexAttribArray(index) {
      GLctx.enableVertexAttribArray(index);
    }

  function _emscripten_glEnablei() {
  err('missing function: emscripten_glEnablei'); abort(-1);
  }

  function _emscripten_glEnd() {
  err('missing function: emscripten_glEnd'); abort(-1);
  }

  function _emscripten_glEndConditionalRender() {
  err('missing function: emscripten_glEndConditionalRender'); abort(-1);
  }

  function _emscripten_glEndList() {
  err('missing function: emscripten_glEndList'); abort(-1);
  }

  function _emscripten_glEndQuery() {
  err('missing function: emscripten_glEndQuery'); abort(-1);
  }

  function _emscripten_glEndTransformFeedback() {
  err('missing function: emscripten_glEndTransformFeedback'); abort(-1);
  }

  function _emscripten_glEvalCoord1d() {
  err('missing function: emscripten_glEvalCoord1d'); abort(-1);
  }

  function _emscripten_glEvalCoord1dv() {
  err('missing function: emscripten_glEvalCoord1dv'); abort(-1);
  }

  function _emscripten_glEvalCoord1f() {
  err('missing function: emscripten_glEvalCoord1f'); abort(-1);
  }

  function _emscripten_glEvalCoord1fv() {
  err('missing function: emscripten_glEvalCoord1fv'); abort(-1);
  }

  function _emscripten_glEvalCoord2d() {
  err('missing function: emscripten_glEvalCoord2d'); abort(-1);
  }

  function _emscripten_glEvalCoord2dv() {
  err('missing function: emscripten_glEvalCoord2dv'); abort(-1);
  }

  function _emscripten_glEvalCoord2f() {
  err('missing function: emscripten_glEvalCoord2f'); abort(-1);
  }

  function _emscripten_glEvalCoord2fv() {
  err('missing function: emscripten_glEvalCoord2fv'); abort(-1);
  }

  function _emscripten_glEvalMesh1() {
  err('missing function: emscripten_glEvalMesh1'); abort(-1);
  }

  function _emscripten_glEvalMesh2() {
  err('missing function: emscripten_glEvalMesh2'); abort(-1);
  }

  function _emscripten_glEvalPoint1() {
  err('missing function: emscripten_glEvalPoint1'); abort(-1);
  }

  function _emscripten_glEvalPoint2() {
  err('missing function: emscripten_glEvalPoint2'); abort(-1);
  }

  function _emscripten_glFeedbackBuffer() {
  err('missing function: emscripten_glFeedbackBuffer'); abort(-1);
  }

  function _emscripten_glFinish() { GLctx['finish']() }

  function _emscripten_glFlush() { GLctx['flush']() }

  function _emscripten_glFogCoordPointer() {
  err('missing function: emscripten_glFogCoordPointer'); abort(-1);
  }

  function _emscripten_glFogCoordd() {
  err('missing function: emscripten_glFogCoordd'); abort(-1);
  }

  function _emscripten_glFogCoorddv() {
  err('missing function: emscripten_glFogCoorddv'); abort(-1);
  }

  function _emscripten_glFogCoordf() {
  err('missing function: emscripten_glFogCoordf'); abort(-1);
  }

  function _emscripten_glFogCoordfv() {
  err('missing function: emscripten_glFogCoordfv'); abort(-1);
  }

  function _emscripten_glFogf() {
  err('missing function: emscripten_glFogf'); abort(-1);
  }

  function _emscripten_glFogfv() {
  err('missing function: emscripten_glFogfv'); abort(-1);
  }

  function _emscripten_glFogi() {
  err('missing function: emscripten_glFogi'); abort(-1);
  }

  function _emscripten_glFogiv() {
  err('missing function: emscripten_glFogiv'); abort(-1);
  }

  function _emscripten_glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
      GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget,
                                         GL.renderbuffers[renderbuffer]);
    }

  function _emscripten_glFramebufferTexture1D() {
  err('missing function: emscripten_glFramebufferTexture1D'); abort(-1);
  }

  function _emscripten_glFramebufferTexture2D(target, attachment, textarget, texture, level) {
      GLctx.framebufferTexture2D(target, attachment, textarget,
                                      GL.textures[texture], level);
    }

  function _emscripten_glFramebufferTexture3D() {
  err('missing function: emscripten_glFramebufferTexture3D'); abort(-1);
  }

  function _emscripten_glFramebufferTextureLayer() {
  err('missing function: emscripten_glFramebufferTextureLayer'); abort(-1);
  }

  function _emscripten_glFrontFace(x0) { GLctx['frontFace'](x0) }

  function _emscripten_glFrustum() {
  err('missing function: emscripten_glFrustum'); abort(-1);
  }

  function _emscripten_glGenBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var buffer = GLctx.createBuffer();
        if (!buffer) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((buffers)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.buffers);
        buffer.name = id;
        GL.buffers[id] = buffer;
        HEAP32[(((buffers)+(i*4))>>2)]=id;
      }
    }

  function _emscripten_glGenFramebuffers(n, ids) {
      for (var i = 0; i < n; ++i) {
        var framebuffer = GLctx.createFramebuffer();
        if (!framebuffer) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((ids)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.framebuffers);
        framebuffer.name = id;
        GL.framebuffers[id] = framebuffer;
        HEAP32[(((ids)+(i*4))>>2)]=id;
      }
    }

  function _emscripten_glGenLists() {
  err('missing function: emscripten_glGenLists'); abort(-1);
  }

  function _emscripten_glGenProgramsARB() {
  err('missing function: emscripten_glGenProgramsARB'); abort(-1);
  }

  function _emscripten_glGenQueries() {
  err('missing function: emscripten_glGenQueries'); abort(-1);
  }

  function _emscripten_glGenRenderbuffers(n, renderbuffers) {
      for (var i = 0; i < n; i++) {
        var renderbuffer = GLctx.createRenderbuffer();
        if (!renderbuffer) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((renderbuffers)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.renderbuffers);
        renderbuffer.name = id;
        GL.renderbuffers[id] = renderbuffer;
        HEAP32[(((renderbuffers)+(i*4))>>2)]=id;
      }
    }

  function _emscripten_glGenTextures(n, textures) {
      for (var i = 0; i < n; i++) {
        var texture = GLctx.createTexture();
        if (!texture) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */); // GLES + EGL specs don't specify what should happen here, so best to issue an error and create IDs with 0.
          while(i < n) HEAP32[(((textures)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.textures);
        texture.name = id;
        GL.textures[id] = texture;
        HEAP32[(((textures)+(i*4))>>2)]=id;
      }
    }

  function _emscripten_glGenVertexArrays(n, arrays) {
  
      for (var i = 0; i < n; i++) {
        var vao = GLctx['createVertexArray']();
        if (!vao) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((arrays)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.vaos);
        vao.name = id;
        GL.vaos[id] = vao;
        HEAP32[(((arrays)+(i*4))>>2)]=id;
      }
    }

  function _emscripten_glGenerateMipmap(x0) { GLctx['generateMipmap'](x0) }

  function _emscripten_glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
      program = GL.programs[program];
      var info = GLctx.getActiveAttrib(program, index);
      if (!info) return; // If an error occurs, nothing will be written to length, size and type and name.
  
      if (bufSize > 0 && name) {
        var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
  
      if (size) HEAP32[((size)>>2)]=info.size;
      if (type) HEAP32[((type)>>2)]=info.type;
    }

  function _emscripten_glGetActiveUniform(program, index, bufSize, length, size, type, name) {
      program = GL.programs[program];
      var info = GLctx.getActiveUniform(program, index);
      if (!info) return; // If an error occurs, nothing will be written to length, size, type and name.
  
      if (bufSize > 0 && name) {
        var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
  
      if (size) HEAP32[((size)>>2)]=info.size;
      if (type) HEAP32[((type)>>2)]=info.type;
    }

  function _emscripten_glGetActiveUniformBlockName() {
  err('missing function: emscripten_glGetActiveUniformBlockName'); abort(-1);
  }

  function _emscripten_glGetActiveUniformBlockiv() {
  err('missing function: emscripten_glGetActiveUniformBlockiv'); abort(-1);
  }

  function _emscripten_glGetActiveUniformName() {
  err('missing function: emscripten_glGetActiveUniformName'); abort(-1);
  }

  function _emscripten_glGetActiveUniformsiv() {
  err('missing function: emscripten_glGetActiveUniformsiv'); abort(-1);
  }

  function _emscripten_glGetAttachedObjectsARB() {
  err('missing function: emscripten_glGetAttachedObjectsARB'); abort(-1);
  }

  function _emscripten_glGetAttachedShaders(program, maxCount, count, shaders) {
      var result = GLctx.getAttachedShaders(GL.programs[program]);
      var len = result.length;
      if (len > maxCount) {
        len = maxCount;
      }
      HEAP32[((count)>>2)]=len;
      for (var i = 0; i < len; ++i) {
        var id = GL.shaders.indexOf(result[i]);
        HEAP32[(((shaders)+(i*4))>>2)]=id;
      }
    }

  function _emscripten_glGetAttribLocation(program, name) {
      return GLctx.getAttribLocation(GL.programs[program], Pointer_stringify(name));
    }

  function _emscripten_glGetBooleani_v() {
  err('missing function: emscripten_glGetBooleani_v'); abort(-1);
  }

  
  function emscriptenWebGLGet(name_, p, type) {
      // Guard against user passing a null pointer.
      // Note that GLES2 spec does not say anything about how passing a null pointer should be treated.
      // Testing on desktop core GL 3, the application crashes on glGetIntegerv to a null pointer, but
      // better to report an error instead of doing anything random.
      if (!p) {
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      var ret = undefined;
      switch(name_) { // Handle a few trivial GLES values
        case 0x8DFA: // GL_SHADER_COMPILER
          ret = 1;
          break;
        case 0x8DF8: // GL_SHADER_BINARY_FORMATS
          if (type !== 'Integer' && type !== 'Integer64') {
            GL.recordError(0x0500); // GL_INVALID_ENUM
          }
          return; // Do not write anything to the out pointer, since no binary formats are supported.
        case 0x8DF9: // GL_NUM_SHADER_BINARY_FORMATS
          ret = 0;
          break;
        case 0x86A2: // GL_NUM_COMPRESSED_TEXTURE_FORMATS
          // WebGL doesn't have GL_NUM_COMPRESSED_TEXTURE_FORMATS (it's obsolete since GL_COMPRESSED_TEXTURE_FORMATS returns a JS array that can be queried for length),
          // so implement it ourselves to allow C++ GLES2 code get the length.
          var formats = GLctx.getParameter(0x86A3 /*GL_COMPRESSED_TEXTURE_FORMATS*/);
          ret = formats ? formats.length : 0;
          break;
      }
  
      if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof(result)) {
          case "number":
            ret = result;
            break;
          case "boolean":
            ret = result ? 1 : 0;
            break;
          case "string":
            GL.recordError(0x0500); // GL_INVALID_ENUM
            return;
          case "object":
            if (result === null) {
              // null is a valid result for some (e.g., which buffer is bound - perhaps nothing is bound), but otherwise
              // can mean an invalid name_, which we need to report as an error
              switch(name_) {
                case 0x8894: // ARRAY_BUFFER_BINDING
                case 0x8B8D: // CURRENT_PROGRAM
                case 0x8895: // ELEMENT_ARRAY_BUFFER_BINDING
                case 0x8CA6: // FRAMEBUFFER_BINDING
                case 0x8CA7: // RENDERBUFFER_BINDING
                case 0x8069: // TEXTURE_BINDING_2D
                case 0x8514: { // TEXTURE_BINDING_CUBE_MAP
                  ret = 0;
                  break;
                }
                default: {
                  GL.recordError(0x0500); // GL_INVALID_ENUM
                  return;
                }
              }
            } else if (result instanceof Float32Array ||
                       result instanceof Uint32Array ||
                       result instanceof Int32Array ||
                       result instanceof Array) {
              for (var i = 0; i < result.length; ++i) {
                switch (type) {
                  case 'Integer': HEAP32[(((p)+(i*4))>>2)]=result[i];   break;
                  case 'Float':   HEAPF32[(((p)+(i*4))>>2)]=result[i]; break;
                  case 'Boolean': HEAP8[(((p)+(i))>>0)]=result[i] ? 1 : 0;    break;
                  default: throw 'internal glGet error, bad type: ' + type;
                }
              }
              return;
            } else {
              try {
                ret = result.name | 0;
              } catch(e) {
                GL.recordError(0x0500); // GL_INVALID_ENUM
                err('GL_INVALID_ENUM in glGet' + type + 'v: Unknown object returned from WebGL getParameter(' + name_ + ')! (error: ' + e + ')');
                return;
              }
            }
            break;
          default:
            GL.recordError(0x0500); // GL_INVALID_ENUM
            return;
        }
      }
  
      switch (type) {
        case 'Integer64': (tempI64 = [ret>>>0,(tempDouble=ret,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((p)>>2)]=tempI64[0],HEAP32[(((p)+(4))>>2)]=tempI64[1]);    break;
        case 'Integer': HEAP32[((p)>>2)]=ret;    break;
        case 'Float':   HEAPF32[((p)>>2)]=ret;  break;
        case 'Boolean': HEAP8[((p)>>0)]=ret ? 1 : 0; break;
        default: throw 'internal glGet error, bad type: ' + type;
      }
    }function _emscripten_glGetBooleanv(name_, p) {
      emscriptenWebGLGet(name_, p, 'Boolean');
    }

  function _emscripten_glGetBufferParameteriv(target, value, data) {
      if (!data) {
        // GLES2 specification does not specify how to behave if data is a null pointer. Since calling this function does not make sense
        // if data == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((data)>>2)]=GLctx.getBufferParameter(target, value);
    }

  function _emscripten_glGetBufferPointerv() {
  err('missing function: emscripten_glGetBufferPointerv'); abort(-1);
  }

  function _emscripten_glGetBufferSubData() {
  err('missing function: emscripten_glGetBufferSubData'); abort(-1);
  }

  function _emscripten_glGetClipPlane() {
  err('missing function: emscripten_glGetClipPlane'); abort(-1);
  }

  function _emscripten_glGetColorTable() {
  err('missing function: emscripten_glGetColorTable'); abort(-1);
  }

  function _emscripten_glGetColorTableParameterfv() {
  err('missing function: emscripten_glGetColorTableParameterfv'); abort(-1);
  }

  function _emscripten_glGetColorTableParameteriv() {
  err('missing function: emscripten_glGetColorTableParameteriv'); abort(-1);
  }

  function _emscripten_glGetCompressedTexImage() {
  err('missing function: emscripten_glGetCompressedTexImage'); abort(-1);
  }

  function _emscripten_glGetConvolutionFilter() {
  err('missing function: emscripten_glGetConvolutionFilter'); abort(-1);
  }

  function _emscripten_glGetConvolutionParameterfv() {
  err('missing function: emscripten_glGetConvolutionParameterfv'); abort(-1);
  }

  function _emscripten_glGetConvolutionParameteriv() {
  err('missing function: emscripten_glGetConvolutionParameteriv'); abort(-1);
  }

  function _emscripten_glGetDoublev() {
  err('missing function: emscripten_glGetDoublev'); abort(-1);
  }

  function _emscripten_glGetError() {
      // First return any GL error generated by the emscripten library_gl.js interop layer.
      if (GL.lastError) {
        var error = GL.lastError;
        GL.lastError = 0/*GL_NO_ERROR*/;
        return error;
      } else { // If there were none, return the GL error from the browser GL context.
        return GLctx.getError();
      }
    }

  function _emscripten_glGetFloatv(name_, p) {
      emscriptenWebGLGet(name_, p, 'Float');
    }

  function _emscripten_glGetFragDataLocation() {
  err('missing function: emscripten_glGetFragDataLocation'); abort(-1);
  }

  function _emscripten_glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
      var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
      if (result instanceof WebGLRenderbuffer ||
          result instanceof WebGLTexture) {
        result = result.name | 0;
      }
      HEAP32[((params)>>2)]=result;
    }

  function _emscripten_glGetHandleARB() {
  err('missing function: emscripten_glGetHandleARB'); abort(-1);
  }

  function _emscripten_glGetHistogram() {
  err('missing function: emscripten_glGetHistogram'); abort(-1);
  }

  function _emscripten_glGetHistogramParameterfv() {
  err('missing function: emscripten_glGetHistogramParameterfv'); abort(-1);
  }

  function _emscripten_glGetHistogramParameteriv() {
  err('missing function: emscripten_glGetHistogramParameteriv'); abort(-1);
  }

  function _emscripten_glGetInfoLogARB() {
  err('missing function: emscripten_glGetInfoLogARB'); abort(-1);
  }

  function _emscripten_glGetIntegeri_v() {
  err('missing function: emscripten_glGetIntegeri_v'); abort(-1);
  }

  function _emscripten_glGetIntegerv(name_, p) {
      emscriptenWebGLGet(name_, p, 'Integer');
    }

  function _emscripten_glGetLightfv() {
  err('missing function: emscripten_glGetLightfv'); abort(-1);
  }

  function _emscripten_glGetLightiv() {
  err('missing function: emscripten_glGetLightiv'); abort(-1);
  }

  function _emscripten_glGetMapdv() {
  err('missing function: emscripten_glGetMapdv'); abort(-1);
  }

  function _emscripten_glGetMapfv() {
  err('missing function: emscripten_glGetMapfv'); abort(-1);
  }

  function _emscripten_glGetMapiv() {
  err('missing function: emscripten_glGetMapiv'); abort(-1);
  }

  function _emscripten_glGetMaterialfv() {
  err('missing function: emscripten_glGetMaterialfv'); abort(-1);
  }

  function _emscripten_glGetMaterialiv() {
  err('missing function: emscripten_glGetMaterialiv'); abort(-1);
  }

  function _emscripten_glGetMinmax() {
  err('missing function: emscripten_glGetMinmax'); abort(-1);
  }

  function _emscripten_glGetMinmaxParameterfv() {
  err('missing function: emscripten_glGetMinmaxParameterfv'); abort(-1);
  }

  function _emscripten_glGetMinmaxParameteriv() {
  err('missing function: emscripten_glGetMinmaxParameteriv'); abort(-1);
  }

  function _emscripten_glGetObjectParameterfvARB() {
  err('missing function: emscripten_glGetObjectParameterfvARB'); abort(-1);
  }

  function _emscripten_glGetObjectParameterivARB() {
  err('missing function: emscripten_glGetObjectParameterivARB'); abort(-1);
  }

  function _emscripten_glGetPixelMapfv() {
  err('missing function: emscripten_glGetPixelMapfv'); abort(-1);
  }

  function _emscripten_glGetPixelMapuiv() {
  err('missing function: emscripten_glGetPixelMapuiv'); abort(-1);
  }

  function _emscripten_glGetPixelMapusv() {
  err('missing function: emscripten_glGetPixelMapusv'); abort(-1);
  }

  function _emscripten_glGetPointerv() {
  err('missing function: emscripten_glGetPointerv'); abort(-1);
  }

  function _emscripten_glGetPolygonStipple() {
  err('missing function: emscripten_glGetPolygonStipple'); abort(-1);
  }

  function _emscripten_glGetProgramEnvParameterdvARB() {
  err('missing function: emscripten_glGetProgramEnvParameterdvARB'); abort(-1);
  }

  function _emscripten_glGetProgramEnvParameterfvARB() {
  err('missing function: emscripten_glGetProgramEnvParameterfvARB'); abort(-1);
  }

  function _emscripten_glGetProgramInfoLog(program, maxLength, length, infoLog) {
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null) log = '(unknown error)';
  
      if (maxLength > 0 && infoLog) {
        var numBytesWrittenExclNull = stringToUTF8(log, infoLog, maxLength);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

  function _emscripten_glGetProgramLocalParameterdvARB() {
  err('missing function: emscripten_glGetProgramLocalParameterdvARB'); abort(-1);
  }

  function _emscripten_glGetProgramLocalParameterfvARB() {
  err('missing function: emscripten_glGetProgramLocalParameterfvARB'); abort(-1);
  }

  function _emscripten_glGetProgramStringARB() {
  err('missing function: emscripten_glGetProgramStringARB'); abort(-1);
  }

  function _emscripten_glGetProgramiv(program, pname, p) {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
  
      if (program >= GL.counter) {
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
  
      var ptable = GL.programInfos[program];
      if (!ptable) {
        GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        return;
      }
  
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)]=log.length + 1;
      } else if (pname == 0x8B87 /* GL_ACTIVE_UNIFORM_MAX_LENGTH */) {
        HEAP32[((p)>>2)]=ptable.maxUniformLength;
      } else if (pname == 0x8B8A /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */) {
        if (ptable.maxAttributeLength == -1) {
          program = GL.programs[program];
          var numAttribs = GLctx.getProgramParameter(program, GLctx.ACTIVE_ATTRIBUTES);
          ptable.maxAttributeLength = 0; // Spec says if there are no active attribs, 0 must be returned.
          for (var i = 0; i < numAttribs; ++i) {
            var activeAttrib = GLctx.getActiveAttrib(program, i);
            ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length+1);
          }
        }
        HEAP32[((p)>>2)]=ptable.maxAttributeLength;
      } else if (pname == 0x8A35 /* GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH */) {
        if (ptable.maxUniformBlockNameLength == -1) {
          program = GL.programs[program];
          var numBlocks = GLctx.getProgramParameter(program, GLctx.ACTIVE_UNIFORM_BLOCKS);
          ptable.maxUniformBlockNameLength = 0;
          for (var i = 0; i < numBlocks; ++i) {
            var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
            ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length+1);
          }
        }
        HEAP32[((p)>>2)]=ptable.maxUniformBlockNameLength;
      } else {
        HEAP32[((p)>>2)]=GLctx.getProgramParameter(GL.programs[program], pname);
      }
    }

  function _emscripten_glGetQueryObjectiv() {
  err('missing function: emscripten_glGetQueryObjectiv'); abort(-1);
  }

  function _emscripten_glGetQueryObjectuiv() {
  err('missing function: emscripten_glGetQueryObjectuiv'); abort(-1);
  }

  function _emscripten_glGetQueryiv() {
  err('missing function: emscripten_glGetQueryiv'); abort(-1);
  }

  function _emscripten_glGetRenderbufferParameteriv(target, pname, params) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)>>2)]=GLctx.getRenderbufferParameter(target, pname);
    }

  function _emscripten_glGetSeparableFilter() {
  err('missing function: emscripten_glGetSeparableFilter'); abort(-1);
  }

  function _emscripten_glGetShaderInfoLog(shader, maxLength, length, infoLog) {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = '(unknown error)';
      if (maxLength > 0 && infoLog) {
        var numBytesWrittenExclNull = stringToUTF8(log, infoLog, maxLength);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

  function _emscripten_glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
      var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
      HEAP32[((range)>>2)]=result.rangeMin;
      HEAP32[(((range)+(4))>>2)]=result.rangeMax;
      HEAP32[((precision)>>2)]=result.precision;
    }

  function _emscripten_glGetShaderSource(shader, bufSize, length, source) {
      var result = GLctx.getShaderSource(GL.shaders[shader]);
      if (!result) return; // If an error occurs, nothing will be written to length or source.
      if (bufSize > 0 && source) {
        var numBytesWrittenExclNull = stringToUTF8(result, source, bufSize);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

  function _emscripten_glGetShaderiv(shader, pname, p) {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)]=log.length + 1;
      } else if (pname == 0x8B88) { // GL_SHADER_SOURCE_LENGTH
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = (source === null || source.length == 0) ? 0 : source.length + 1;
        HEAP32[((p)>>2)]=sourceLength;
      } else {
        HEAP32[((p)>>2)]=GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    }

  function _emscripten_glGetString(name_) {
      if (GL.stringCache[name_]) return GL.stringCache[name_];
      var ret;
      switch(name_) {
        case 0x1F03 /* GL_EXTENSIONS */:
          var exts = GLctx.getSupportedExtensions();
          var gl_exts = [];
          for (var i = 0; i < exts.length; ++i) {
            gl_exts.push(exts[i]);
            gl_exts.push("GL_" + exts[i]);
          }
          ret = allocate(intArrayFromString(gl_exts.join(' ')), 'i8', ALLOC_NORMAL);
          break;
        case 0x1F00 /* GL_VENDOR */:
        case 0x1F01 /* GL_RENDERER */:
        case 0x9245 /* UNMASKED_VENDOR_WEBGL */:
        case 0x9246 /* UNMASKED_RENDERER_WEBGL */:
          var s = GLctx.getParameter(name_);
          if (!s) {
            GL.recordError(0x0500/*GL_INVALID_ENUM*/);
          }
          ret = allocate(intArrayFromString(s), 'i8', ALLOC_NORMAL);
          break;
  
        case 0x1F02 /* GL_VERSION */:
          var glVersion = GLctx.getParameter(GLctx.VERSION);
          // return GLES version string corresponding to the version of the WebGL context
          {
            glVersion = 'OpenGL ES 2.0 (' + glVersion + ')';
          }
          ret = allocate(intArrayFromString(glVersion), 'i8', ALLOC_NORMAL);
          break;
        case 0x8B8C /* GL_SHADING_LANGUAGE_VERSION */:
          var glslVersion = GLctx.getParameter(GLctx.SHADING_LANGUAGE_VERSION);
          // extract the version number 'N.M' from the string 'WebGL GLSL ES N.M ...'
          var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
          var ver_num = glslVersion.match(ver_re);
          if (ver_num !== null) {
            if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + '0'; // ensure minor version has 2 digits
            glslVersion = 'OpenGL ES GLSL ES ' + ver_num[1] + ' (' + glslVersion + ')';
          }
          ret = allocate(intArrayFromString(glslVersion), 'i8', ALLOC_NORMAL);
          break;
        default:
          GL.recordError(0x0500/*GL_INVALID_ENUM*/);
          return 0;
      }
      GL.stringCache[name_] = ret;
      return ret;
    }

  function _emscripten_glGetStringi() {
  err('missing function: emscripten_glGetStringi'); abort(-1);
  }

  function _emscripten_glGetTexEnvfv() {
  err('missing function: emscripten_glGetTexEnvfv'); abort(-1);
  }

  function _emscripten_glGetTexEnviv() {
  err('missing function: emscripten_glGetTexEnviv'); abort(-1);
  }

  function _emscripten_glGetTexGendv() {
  err('missing function: emscripten_glGetTexGendv'); abort(-1);
  }

  function _emscripten_glGetTexGenfv() {
  err('missing function: emscripten_glGetTexGenfv'); abort(-1);
  }

  function _emscripten_glGetTexGeniv() {
  err('missing function: emscripten_glGetTexGeniv'); abort(-1);
  }

  function _emscripten_glGetTexImage() {
  err('missing function: emscripten_glGetTexImage'); abort(-1);
  }

  function _emscripten_glGetTexLevelParameterfv() {
  err('missing function: emscripten_glGetTexLevelParameterfv'); abort(-1);
  }

  function _emscripten_glGetTexLevelParameteriv() {
  err('missing function: emscripten_glGetTexLevelParameteriv'); abort(-1);
  }

  function _emscripten_glGetTexParameterIiv() {
  err('missing function: emscripten_glGetTexParameterIiv'); abort(-1);
  }

  function _emscripten_glGetTexParameterIuiv() {
  err('missing function: emscripten_glGetTexParameterIuiv'); abort(-1);
  }

  function _emscripten_glGetTexParameterfv(target, pname, params) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAPF32[((params)>>2)]=GLctx.getTexParameter(target, pname);
    }

  function _emscripten_glGetTexParameteriv(target, pname, params) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)>>2)]=GLctx.getTexParameter(target, pname);
    }

  function _emscripten_glGetTransformFeedbackVarying() {
  err('missing function: emscripten_glGetTransformFeedbackVarying'); abort(-1);
  }

  function _emscripten_glGetUniformBlockIndex() {
  err('missing function: emscripten_glGetUniformBlockIndex'); abort(-1);
  }

  function _emscripten_glGetUniformIndices() {
  err('missing function: emscripten_glGetUniformIndices'); abort(-1);
  }

  function _emscripten_glGetUniformLocation(program, name) {
      name = Pointer_stringify(name);
  
      var arrayOffset = 0;
      // If user passed an array accessor "[index]", parse the array index off the accessor.
      if (name.indexOf(']', name.length-1) !== -1) {
        var ls = name.lastIndexOf('[');
        var arrayIndex = name.slice(ls+1, -1);
        if (arrayIndex.length > 0) {
          arrayOffset = parseInt(arrayIndex);
          if (arrayOffset < 0) {
            return -1;
          }
        }
        name = name.slice(0, ls);
      }
  
      var ptable = GL.programInfos[program];
      if (!ptable) {
        return -1;
      }
      var utable = ptable.uniforms;
      var uniformInfo = utable[name]; // returns pair [ dimension_of_uniform_array, uniform_location ]
      if (uniformInfo && arrayOffset < uniformInfo[0]) { // Check if user asked for an out-of-bounds element, i.e. for 'vec4 colors[3];' user could ask for 'colors[10]' which should return -1.
        return uniformInfo[1]+arrayOffset;
      } else {
        return -1;
      }
    }

  
  function emscriptenWebGLGetUniform(program, location, params, type) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      var data = GLctx.getUniform(GL.programs[program], GL.uniforms[location]);
      if (typeof data == 'number' || typeof data == 'boolean') {
        switch (type) {
          case 'Integer': HEAP32[((params)>>2)]=data; break;
          case 'Float': HEAPF32[((params)>>2)]=data; break;
          default: throw 'internal emscriptenWebGLGetUniform() error, bad type: ' + type;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 'Integer': HEAP32[(((params)+(i*4))>>2)]=data[i]; break;
            case 'Float': HEAPF32[(((params)+(i*4))>>2)]=data[i]; break;
            default: throw 'internal emscriptenWebGLGetUniform() error, bad type: ' + type;
          }
        }
      }
    }function _emscripten_glGetUniformfv(program, location, params) {
      emscriptenWebGLGetUniform(program, location, params, 'Float');
    }

  function _emscripten_glGetUniformiv(program, location, params) {
      emscriptenWebGLGetUniform(program, location, params, 'Integer');
    }

  function _emscripten_glGetUniformuiv() {
  err('missing function: emscripten_glGetUniformuiv'); abort(-1);
  }

  function _emscripten_glGetVertexAttribIiv() {
  err('missing function: emscripten_glGetVertexAttribIiv'); abort(-1);
  }

  function _emscripten_glGetVertexAttribIuiv() {
  err('missing function: emscripten_glGetVertexAttribIuiv'); abort(-1);
  }

  function _emscripten_glGetVertexAttribPointerv(index, pname, pointer) {
      if (!pointer) {
        // GLES2 specification does not specify how to behave if pointer is a null pointer. Since calling this function does not make sense
        // if pointer == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((pointer)>>2)]=GLctx.getVertexAttribOffset(index, pname);
    }

  function _emscripten_glGetVertexAttribdv() {
  err('missing function: emscripten_glGetVertexAttribdv'); abort(-1);
  }

  
  function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      var data = GLctx.getVertexAttrib(index, pname);
      if (pname == 0x889F/*VERTEX_ATTRIB_ARRAY_BUFFER_BINDING*/) {
        HEAP32[((params)>>2)]=data["name"];
      } else if (typeof data == 'number' || typeof data == 'boolean') {
        switch (type) {
          case 'Integer': HEAP32[((params)>>2)]=data; break;
          case 'Float': HEAPF32[((params)>>2)]=data; break;
          case 'FloatToInteger': HEAP32[((params)>>2)]=Math.fround(data); break;
          default: throw 'internal emscriptenWebGLGetVertexAttrib() error, bad type: ' + type;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 'Integer': HEAP32[(((params)+(i*4))>>2)]=data[i]; break;
            case 'Float': HEAPF32[(((params)+(i*4))>>2)]=data[i]; break;
            case 'FloatToInteger': HEAP32[(((params)+(i*4))>>2)]=Math.fround(data[i]); break;
            default: throw 'internal emscriptenWebGLGetVertexAttrib() error, bad type: ' + type;
          }
        }
      }
    }function _emscripten_glGetVertexAttribfv(index, pname, params) {
      // N.B. This function may only be called if the vertex attribute was specified using the function glVertexAttrib*f(),
      // otherwise the results are undefined. (GLES3 spec 6.1.12)
      emscriptenWebGLGetVertexAttrib(index, pname, params, 'Float');
    }

  function _emscripten_glGetVertexAttribiv(index, pname, params) {
      // N.B. This function may only be called if the vertex attribute was specified using the function glVertexAttrib*f(),
      // otherwise the results are undefined. (GLES3 spec 6.1.12)
      emscriptenWebGLGetVertexAttrib(index, pname, params, 'FloatToInteger');
    }

  function _emscripten_glHint(x0, x1) { GLctx['hint'](x0, x1) }

  function _emscripten_glHistogram() {
  err('missing function: emscripten_glHistogram'); abort(-1);
  }

  function _emscripten_glIndexMask() {
  err('missing function: emscripten_glIndexMask'); abort(-1);
  }

  function _emscripten_glIndexPointer() {
  err('missing function: emscripten_glIndexPointer'); abort(-1);
  }

  function _emscripten_glIndexd() {
  err('missing function: emscripten_glIndexd'); abort(-1);
  }

  function _emscripten_glIndexdv() {
  err('missing function: emscripten_glIndexdv'); abort(-1);
  }

  function _emscripten_glIndexf() {
  err('missing function: emscripten_glIndexf'); abort(-1);
  }

  function _emscripten_glIndexfv() {
  err('missing function: emscripten_glIndexfv'); abort(-1);
  }

  function _emscripten_glIndexi() {
  err('missing function: emscripten_glIndexi'); abort(-1);
  }

  function _emscripten_glIndexiv() {
  err('missing function: emscripten_glIndexiv'); abort(-1);
  }

  function _emscripten_glIndexs() {
  err('missing function: emscripten_glIndexs'); abort(-1);
  }

  function _emscripten_glIndexsv() {
  err('missing function: emscripten_glIndexsv'); abort(-1);
  }

  function _emscripten_glIndexub() {
  err('missing function: emscripten_glIndexub'); abort(-1);
  }

  function _emscripten_glIndexubv() {
  err('missing function: emscripten_glIndexubv'); abort(-1);
  }

  function _emscripten_glInitNames() {
  err('missing function: emscripten_glInitNames'); abort(-1);
  }

  function _emscripten_glInterleavedArrays() {
  err('missing function: emscripten_glInterleavedArrays'); abort(-1);
  }

  function _emscripten_glIsBuffer(buffer) {
      var b = GL.buffers[buffer];
      if (!b) return 0;
      return GLctx.isBuffer(b);
    }

  function _emscripten_glIsEnabled(x0) { return GLctx['isEnabled'](x0) }

  function _emscripten_glIsEnabledi() {
  err('missing function: emscripten_glIsEnabledi'); abort(-1);
  }

  function _emscripten_glIsFramebuffer(framebuffer) {
      var fb = GL.framebuffers[framebuffer];
      if (!fb) return 0;
      return GLctx.isFramebuffer(fb);
    }

  function _emscripten_glIsList() {
  err('missing function: emscripten_glIsList'); abort(-1);
  }

  function _emscripten_glIsProgram(program) {
      program = GL.programs[program];
      if (!program) return 0;
      return GLctx.isProgram(program);
    }

  function _emscripten_glIsQuery() {
  err('missing function: emscripten_glIsQuery'); abort(-1);
  }

  function _emscripten_glIsRenderbuffer(renderbuffer) {
      var rb = GL.renderbuffers[renderbuffer];
      if (!rb) return 0;
      return GLctx.isRenderbuffer(rb);
    }

  function _emscripten_glIsShader(shader) {
      var s = GL.shaders[shader];
      if (!s) return 0;
      return GLctx.isShader(s);
    }

  function _emscripten_glIsTexture(texture) {
      var texture = GL.textures[texture];
      if (!texture) return 0;
      return GLctx.isTexture(texture);
    }

  function _emscripten_glIsVertexArray(array) {
  
      var vao = GL.vaos[array];
      if (!vao) return 0;
      return GLctx['isVertexArray'](vao);
    }

  function _emscripten_glLightModelf() {
  err('missing function: emscripten_glLightModelf'); abort(-1);
  }

  function _emscripten_glLightModelfv() {
  err('missing function: emscripten_glLightModelfv'); abort(-1);
  }

  function _emscripten_glLightModeli() {
  err('missing function: emscripten_glLightModeli'); abort(-1);
  }

  function _emscripten_glLightModeliv() {
  err('missing function: emscripten_glLightModeliv'); abort(-1);
  }

  function _emscripten_glLightf() {
  err('missing function: emscripten_glLightf'); abort(-1);
  }

  function _emscripten_glLightfv() {
  err('missing function: emscripten_glLightfv'); abort(-1);
  }

  function _emscripten_glLighti() {
  err('missing function: emscripten_glLighti'); abort(-1);
  }

  function _emscripten_glLightiv() {
  err('missing function: emscripten_glLightiv'); abort(-1);
  }

  function _emscripten_glLineStipple() {
  err('missing function: emscripten_glLineStipple'); abort(-1);
  }

  function _emscripten_glLineWidth(x0) { GLctx['lineWidth'](x0) }

  function _emscripten_glLinkProgram(program) {
      GLctx.linkProgram(GL.programs[program]);
      GL.programInfos[program] = null; // uniforms no longer keep the same names after linking
      GL.populateUniformTable(program);
    }

  function _emscripten_glListBase() {
  err('missing function: emscripten_glListBase'); abort(-1);
  }

  function _emscripten_glLoadIdentity(){ throw 'Legacy GL function (glLoadIdentity) called. If you want legacy GL emulation, you need to compile with -s LEGACY_GL_EMULATION=1 to enable legacy GL emulation.'; }

  function _emscripten_glLoadMatrixd() {
  err('missing function: emscripten_glLoadMatrixd'); abort(-1);
  }

  function _emscripten_glLoadMatrixf() {
  err('missing function: emscripten_glLoadMatrixf'); abort(-1);
  }

  function _emscripten_glLoadName() {
  err('missing function: emscripten_glLoadName'); abort(-1);
  }

  function _emscripten_glLoadTransposeMatrixd() {
  err('missing function: emscripten_glLoadTransposeMatrixd'); abort(-1);
  }

  function _emscripten_glLoadTransposeMatrixf() {
  err('missing function: emscripten_glLoadTransposeMatrixf'); abort(-1);
  }

  function _emscripten_glLogicOp() {
  err('missing function: emscripten_glLogicOp'); abort(-1);
  }

  function _emscripten_glMap1d() {
  err('missing function: emscripten_glMap1d'); abort(-1);
  }

  function _emscripten_glMap1f() {
  err('missing function: emscripten_glMap1f'); abort(-1);
  }

  function _emscripten_glMap2d() {
  err('missing function: emscripten_glMap2d'); abort(-1);
  }

  function _emscripten_glMap2f() {
  err('missing function: emscripten_glMap2f'); abort(-1);
  }

  function _emscripten_glMapBuffer() {
  err('missing function: emscripten_glMapBuffer'); abort(-1);
  }

  function _emscripten_glMapGrid1d() {
  err('missing function: emscripten_glMapGrid1d'); abort(-1);
  }

  function _emscripten_glMapGrid1f() {
  err('missing function: emscripten_glMapGrid1f'); abort(-1);
  }

  function _emscripten_glMapGrid2d() {
  err('missing function: emscripten_glMapGrid2d'); abort(-1);
  }

  function _emscripten_glMapGrid2f() {
  err('missing function: emscripten_glMapGrid2f'); abort(-1);
  }

  function _emscripten_glMaterialf() {
  err('missing function: emscripten_glMaterialf'); abort(-1);
  }

  function _emscripten_glMaterialfv() {
  err('missing function: emscripten_glMaterialfv'); abort(-1);
  }

  function _emscripten_glMateriali() {
  err('missing function: emscripten_glMateriali'); abort(-1);
  }

  function _emscripten_glMaterialiv() {
  err('missing function: emscripten_glMaterialiv'); abort(-1);
  }

  function _emscripten_glMatrixMode(){ throw 'Legacy GL function (glMatrixMode) called. If you want legacy GL emulation, you need to compile with -s LEGACY_GL_EMULATION=1 to enable legacy GL emulation.'; }

  function _emscripten_glMinmax() {
  err('missing function: emscripten_glMinmax'); abort(-1);
  }

  function _emscripten_glMultMatrixd() {
  err('missing function: emscripten_glMultMatrixd'); abort(-1);
  }

  function _emscripten_glMultMatrixf() {
  err('missing function: emscripten_glMultMatrixf'); abort(-1);
  }

  function _emscripten_glMultTransposeMatrixd() {
  err('missing function: emscripten_glMultTransposeMatrixd'); abort(-1);
  }

  function _emscripten_glMultTransposeMatrixf() {
  err('missing function: emscripten_glMultTransposeMatrixf'); abort(-1);
  }

  function _emscripten_glMultiDrawArrays() {
  err('missing function: emscripten_glMultiDrawArrays'); abort(-1);
  }

  function _emscripten_glMultiDrawElements() {
  err('missing function: emscripten_glMultiDrawElements'); abort(-1);
  }

  function _emscripten_glMultiTexCoord1d() {
  err('missing function: emscripten_glMultiTexCoord1d'); abort(-1);
  }

  function _emscripten_glMultiTexCoord1dv() {
  err('missing function: emscripten_glMultiTexCoord1dv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord1f() {
  err('missing function: emscripten_glMultiTexCoord1f'); abort(-1);
  }

  function _emscripten_glMultiTexCoord1fv() {
  err('missing function: emscripten_glMultiTexCoord1fv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord1i() {
  err('missing function: emscripten_glMultiTexCoord1i'); abort(-1);
  }

  function _emscripten_glMultiTexCoord1iv() {
  err('missing function: emscripten_glMultiTexCoord1iv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord1s() {
  err('missing function: emscripten_glMultiTexCoord1s'); abort(-1);
  }

  function _emscripten_glMultiTexCoord1sv() {
  err('missing function: emscripten_glMultiTexCoord1sv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord2d() {
  err('missing function: emscripten_glMultiTexCoord2d'); abort(-1);
  }

  function _emscripten_glMultiTexCoord2dv() {
  err('missing function: emscripten_glMultiTexCoord2dv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord2f() {
  err('missing function: emscripten_glMultiTexCoord2f'); abort(-1);
  }

  function _emscripten_glMultiTexCoord2fv() {
  err('missing function: emscripten_glMultiTexCoord2fv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord2i() {
  err('missing function: emscripten_glMultiTexCoord2i'); abort(-1);
  }

  function _emscripten_glMultiTexCoord2iv() {
  err('missing function: emscripten_glMultiTexCoord2iv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord2s() {
  err('missing function: emscripten_glMultiTexCoord2s'); abort(-1);
  }

  function _emscripten_glMultiTexCoord2sv() {
  err('missing function: emscripten_glMultiTexCoord2sv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord3d() {
  err('missing function: emscripten_glMultiTexCoord3d'); abort(-1);
  }

  function _emscripten_glMultiTexCoord3dv() {
  err('missing function: emscripten_glMultiTexCoord3dv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord3f() {
  err('missing function: emscripten_glMultiTexCoord3f'); abort(-1);
  }

  function _emscripten_glMultiTexCoord3fv() {
  err('missing function: emscripten_glMultiTexCoord3fv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord3i() {
  err('missing function: emscripten_glMultiTexCoord3i'); abort(-1);
  }

  function _emscripten_glMultiTexCoord3iv() {
  err('missing function: emscripten_glMultiTexCoord3iv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord3s() {
  err('missing function: emscripten_glMultiTexCoord3s'); abort(-1);
  }

  function _emscripten_glMultiTexCoord3sv() {
  err('missing function: emscripten_glMultiTexCoord3sv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord4d() {
  err('missing function: emscripten_glMultiTexCoord4d'); abort(-1);
  }

  function _emscripten_glMultiTexCoord4dv() {
  err('missing function: emscripten_glMultiTexCoord4dv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord4f() {
  err('missing function: emscripten_glMultiTexCoord4f'); abort(-1);
  }

  function _emscripten_glMultiTexCoord4fv() {
  err('missing function: emscripten_glMultiTexCoord4fv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord4i() {
  err('missing function: emscripten_glMultiTexCoord4i'); abort(-1);
  }

  function _emscripten_glMultiTexCoord4iv() {
  err('missing function: emscripten_glMultiTexCoord4iv'); abort(-1);
  }

  function _emscripten_glMultiTexCoord4s() {
  err('missing function: emscripten_glMultiTexCoord4s'); abort(-1);
  }

  function _emscripten_glMultiTexCoord4sv() {
  err('missing function: emscripten_glMultiTexCoord4sv'); abort(-1);
  }

  function _emscripten_glNewList() {
  err('missing function: emscripten_glNewList'); abort(-1);
  }

  function _emscripten_glNormal3b() {
  err('missing function: emscripten_glNormal3b'); abort(-1);
  }

  function _emscripten_glNormal3bv() {
  err('missing function: emscripten_glNormal3bv'); abort(-1);
  }

  function _emscripten_glNormal3d() {
  err('missing function: emscripten_glNormal3d'); abort(-1);
  }

  function _emscripten_glNormal3dv() {
  err('missing function: emscripten_glNormal3dv'); abort(-1);
  }

  function _emscripten_glNormal3f() {
  err('missing function: emscripten_glNormal3f'); abort(-1);
  }

  function _emscripten_glNormal3fv() {
  err('missing function: emscripten_glNormal3fv'); abort(-1);
  }

  function _emscripten_glNormal3i() {
  err('missing function: emscripten_glNormal3i'); abort(-1);
  }

  function _emscripten_glNormal3iv() {
  err('missing function: emscripten_glNormal3iv'); abort(-1);
  }

  function _emscripten_glNormal3s() {
  err('missing function: emscripten_glNormal3s'); abort(-1);
  }

  function _emscripten_glNormal3sv() {
  err('missing function: emscripten_glNormal3sv'); abort(-1);
  }

  function _emscripten_glNormalPointer() {
  err('missing function: emscripten_glNormalPointer'); abort(-1);
  }

  function _emscripten_glOrtho() {
  err('missing function: emscripten_glOrtho'); abort(-1);
  }

  function _emscripten_glPassThrough() {
  err('missing function: emscripten_glPassThrough'); abort(-1);
  }

  function _emscripten_glPixelMapfv() {
  err('missing function: emscripten_glPixelMapfv'); abort(-1);
  }

  function _emscripten_glPixelMapuiv() {
  err('missing function: emscripten_glPixelMapuiv'); abort(-1);
  }

  function _emscripten_glPixelMapusv() {
  err('missing function: emscripten_glPixelMapusv'); abort(-1);
  }

  function _emscripten_glPixelStoref() {
  err('missing function: emscripten_glPixelStoref'); abort(-1);
  }

  function _emscripten_glPixelStorei(pname, param) {
      if (pname == 0x0D05 /* GL_PACK_ALIGNMENT */) {
        GL.packAlignment = param;
      } else if (pname == 0x0cf5 /* GL_UNPACK_ALIGNMENT */) {
        GL.unpackAlignment = param;
      }
      GLctx.pixelStorei(pname, param);
    }

  function _emscripten_glPixelTransferf() {
  err('missing function: emscripten_glPixelTransferf'); abort(-1);
  }

  function _emscripten_glPixelTransferi() {
  err('missing function: emscripten_glPixelTransferi'); abort(-1);
  }

  function _emscripten_glPixelZoom() {
  err('missing function: emscripten_glPixelZoom'); abort(-1);
  }

  function _emscripten_glPointParameterf() {
  err('missing function: emscripten_glPointParameterf'); abort(-1);
  }

  function _emscripten_glPointParameterfv() {
  err('missing function: emscripten_glPointParameterfv'); abort(-1);
  }

  function _emscripten_glPointParameteri() {
  err('missing function: emscripten_glPointParameteri'); abort(-1);
  }

  function _emscripten_glPointParameteriv() {
  err('missing function: emscripten_glPointParameteriv'); abort(-1);
  }

  function _emscripten_glPointSize() {
  err('missing function: emscripten_glPointSize'); abort(-1);
  }

  function _emscripten_glPolygonMode() {
  err('missing function: emscripten_glPolygonMode'); abort(-1);
  }

  function _emscripten_glPolygonOffset(x0, x1) { GLctx['polygonOffset'](x0, x1) }

  function _emscripten_glPolygonStipple() {
  err('missing function: emscripten_glPolygonStipple'); abort(-1);
  }

  function _emscripten_glPopAttrib() {
  err('missing function: emscripten_glPopAttrib'); abort(-1);
  }

  function _emscripten_glPopClientAttrib() {
  err('missing function: emscripten_glPopClientAttrib'); abort(-1);
  }

  function _emscripten_glPopMatrix() {
  err('missing function: emscripten_glPopMatrix'); abort(-1);
  }

  function _emscripten_glPopName() {
  err('missing function: emscripten_glPopName'); abort(-1);
  }

  function _emscripten_glPrimitiveRestartIndex() {
  err('missing function: emscripten_glPrimitiveRestartIndex'); abort(-1);
  }

  function _emscripten_glPrioritizeTextures() {
  err('missing function: emscripten_glPrioritizeTextures'); abort(-1);
  }

  function _emscripten_glProgramEnvParameter4dARB() {
  err('missing function: emscripten_glProgramEnvParameter4dARB'); abort(-1);
  }

  function _emscripten_glProgramEnvParameter4dvARB() {
  err('missing function: emscripten_glProgramEnvParameter4dvARB'); abort(-1);
  }

  function _emscripten_glProgramEnvParameter4fARB() {
  err('missing function: emscripten_glProgramEnvParameter4fARB'); abort(-1);
  }

  function _emscripten_glProgramEnvParameter4fvARB() {
  err('missing function: emscripten_glProgramEnvParameter4fvARB'); abort(-1);
  }

  function _emscripten_glProgramLocalParameter4dARB() {
  err('missing function: emscripten_glProgramLocalParameter4dARB'); abort(-1);
  }

  function _emscripten_glProgramLocalParameter4dvARB() {
  err('missing function: emscripten_glProgramLocalParameter4dvARB'); abort(-1);
  }

  function _emscripten_glProgramLocalParameter4fARB() {
  err('missing function: emscripten_glProgramLocalParameter4fARB'); abort(-1);
  }

  function _emscripten_glProgramLocalParameter4fvARB() {
  err('missing function: emscripten_glProgramLocalParameter4fvARB'); abort(-1);
  }

  function _emscripten_glProgramStringARB() {
  err('missing function: emscripten_glProgramStringARB'); abort(-1);
  }

  function _emscripten_glPushAttrib() {
  err('missing function: emscripten_glPushAttrib'); abort(-1);
  }

  function _emscripten_glPushClientAttrib() {
  err('missing function: emscripten_glPushClientAttrib'); abort(-1);
  }

  function _emscripten_glPushMatrix() {
  err('missing function: emscripten_glPushMatrix'); abort(-1);
  }

  function _emscripten_glPushName() {
  err('missing function: emscripten_glPushName'); abort(-1);
  }

  function _emscripten_glRasterPos2d() {
  err('missing function: emscripten_glRasterPos2d'); abort(-1);
  }

  function _emscripten_glRasterPos2dv() {
  err('missing function: emscripten_glRasterPos2dv'); abort(-1);
  }

  function _emscripten_glRasterPos2f() {
  err('missing function: emscripten_glRasterPos2f'); abort(-1);
  }

  function _emscripten_glRasterPos2fv() {
  err('missing function: emscripten_glRasterPos2fv'); abort(-1);
  }

  function _emscripten_glRasterPos2i() {
  err('missing function: emscripten_glRasterPos2i'); abort(-1);
  }

  function _emscripten_glRasterPos2iv() {
  err('missing function: emscripten_glRasterPos2iv'); abort(-1);
  }

  function _emscripten_glRasterPos2s() {
  err('missing function: emscripten_glRasterPos2s'); abort(-1);
  }

  function _emscripten_glRasterPos2sv() {
  err('missing function: emscripten_glRasterPos2sv'); abort(-1);
  }

  function _emscripten_glRasterPos3d() {
  err('missing function: emscripten_glRasterPos3d'); abort(-1);
  }

  function _emscripten_glRasterPos3dv() {
  err('missing function: emscripten_glRasterPos3dv'); abort(-1);
  }

  function _emscripten_glRasterPos3f() {
  err('missing function: emscripten_glRasterPos3f'); abort(-1);
  }

  function _emscripten_glRasterPos3fv() {
  err('missing function: emscripten_glRasterPos3fv'); abort(-1);
  }

  function _emscripten_glRasterPos3i() {
  err('missing function: emscripten_glRasterPos3i'); abort(-1);
  }

  function _emscripten_glRasterPos3iv() {
  err('missing function: emscripten_glRasterPos3iv'); abort(-1);
  }

  function _emscripten_glRasterPos3s() {
  err('missing function: emscripten_glRasterPos3s'); abort(-1);
  }

  function _emscripten_glRasterPos3sv() {
  err('missing function: emscripten_glRasterPos3sv'); abort(-1);
  }

  function _emscripten_glRasterPos4d() {
  err('missing function: emscripten_glRasterPos4d'); abort(-1);
  }

  function _emscripten_glRasterPos4dv() {
  err('missing function: emscripten_glRasterPos4dv'); abort(-1);
  }

  function _emscripten_glRasterPos4f() {
  err('missing function: emscripten_glRasterPos4f'); abort(-1);
  }

  function _emscripten_glRasterPos4fv() {
  err('missing function: emscripten_glRasterPos4fv'); abort(-1);
  }

  function _emscripten_glRasterPos4i() {
  err('missing function: emscripten_glRasterPos4i'); abort(-1);
  }

  function _emscripten_glRasterPos4iv() {
  err('missing function: emscripten_glRasterPos4iv'); abort(-1);
  }

  function _emscripten_glRasterPos4s() {
  err('missing function: emscripten_glRasterPos4s'); abort(-1);
  }

  function _emscripten_glRasterPos4sv() {
  err('missing function: emscripten_glRasterPos4sv'); abort(-1);
  }

  function _emscripten_glReadBuffer() {
  err('missing function: emscripten_glReadBuffer'); abort(-1);
  }

  
  
  function emscriptenWebGLComputeImageSize(width, height, sizePerPixel, alignment) {
      function roundedToNextMultipleOf(x, y) {
        return Math.floor((x + y - 1) / y) * y
      }
      var plainRowSize = width * sizePerPixel;
      var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
      return (height <= 0) ? 0 :
               ((height - 1) * alignedRowSize + plainRowSize);
    }function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
      var sizePerPixel;
      var numChannels;
      switch(format) {
        case 0x1906 /* GL_ALPHA */:
        case 0x1909 /* GL_LUMINANCE */:
        case 0x1902 /* GL_DEPTH_COMPONENT */:
          numChannels = 1;
          break;
        case 0x190A /* GL_LUMINANCE_ALPHA */:
          numChannels = 2;
          break;
        case 0x1907 /* GL_RGB */:
        case 0x8C40 /* GL_SRGB_EXT */:
          numChannels = 3;
          break;
        case 0x1908 /* GL_RGBA */:
        case 0x8C42 /* GL_SRGB_ALPHA_EXT */:
          numChannels = 4;
          break;
        default:
          GL.recordError(0x0500); // GL_INVALID_ENUM
          return null;
      }
      switch (type) {
        case 0x1401 /* GL_UNSIGNED_BYTE */:
          sizePerPixel = numChannels*1;
          break;
        case 0x1403 /* GL_UNSIGNED_SHORT */:
        case 0x8D61 /* GL_HALF_FLOAT_OES */:
          sizePerPixel = numChannels*2;
          break;
        case 0x1405 /* GL_UNSIGNED_INT */:
        case 0x1406 /* GL_FLOAT */:
          sizePerPixel = numChannels*4;
          break;
        case 0x84FA /* GL_UNSIGNED_INT_24_8_WEBGL/GL_UNSIGNED_INT_24_8 */:
          sizePerPixel = 4;
          break;
        case 0x8363 /* GL_UNSIGNED_SHORT_5_6_5 */:
        case 0x8033 /* GL_UNSIGNED_SHORT_4_4_4_4 */:
        case 0x8034 /* GL_UNSIGNED_SHORT_5_5_5_1 */:
          sizePerPixel = 2;
          break;
        default:
          GL.recordError(0x0500); // GL_INVALID_ENUM
          return null;
      }
      var bytes = emscriptenWebGLComputeImageSize(width, height, sizePerPixel, GL.unpackAlignment);
      switch(type) {
        case 0x1401 /* GL_UNSIGNED_BYTE */:
          return HEAPU8.subarray((pixels),(pixels+bytes));
        case 0x1406 /* GL_FLOAT */:
          return HEAPF32.subarray((pixels)>>2,(pixels+bytes)>>2);
        case 0x1405 /* GL_UNSIGNED_INT */:
        case 0x84FA /* GL_UNSIGNED_INT_24_8_WEBGL/GL_UNSIGNED_INT_24_8 */:
          return HEAPU32.subarray((pixels)>>2,(pixels+bytes)>>2);
        case 0x1403 /* GL_UNSIGNED_SHORT */:
        case 0x8363 /* GL_UNSIGNED_SHORT_5_6_5 */:
        case 0x8033 /* GL_UNSIGNED_SHORT_4_4_4_4 */:
        case 0x8034 /* GL_UNSIGNED_SHORT_5_5_5_1 */:
        case 0x8D61 /* GL_HALF_FLOAT_OES */:
          return HEAPU16.subarray((pixels)>>1,(pixels+bytes)>>1);
        default:
          GL.recordError(0x0500); // GL_INVALID_ENUM
          return null;
      }
    }function _emscripten_glReadPixels(x, y, width, height, format, type, pixels) {
      var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
      if (!pixelData) {
        GL.recordError(0x0500/*GL_INVALID_ENUM*/);
        return;
      }
      GLctx.readPixels(x, y, width, height, format, type, pixelData);
    }

  function _emscripten_glRectd() {
  err('missing function: emscripten_glRectd'); abort(-1);
  }

  function _emscripten_glRectdv() {
  err('missing function: emscripten_glRectdv'); abort(-1);
  }

  function _emscripten_glRectf() {
  err('missing function: emscripten_glRectf'); abort(-1);
  }

  function _emscripten_glRectfv() {
  err('missing function: emscripten_glRectfv'); abort(-1);
  }

  function _emscripten_glRecti() {
  err('missing function: emscripten_glRecti'); abort(-1);
  }

  function _emscripten_glRectiv() {
  err('missing function: emscripten_glRectiv'); abort(-1);
  }

  function _emscripten_glRects() {
  err('missing function: emscripten_glRects'); abort(-1);
  }

  function _emscripten_glRectsv() {
  err('missing function: emscripten_glRectsv'); abort(-1);
  }

  function _emscripten_glReleaseShaderCompiler() {
      // NOP (as allowed by GLES 2.0 spec)
    }

  function _emscripten_glRenderMode() {
  err('missing function: emscripten_glRenderMode'); abort(-1);
  }

  function _emscripten_glRenderbufferStorage(x0, x1, x2, x3) { GLctx['renderbufferStorage'](x0, x1, x2, x3) }

  function _emscripten_glRenderbufferStorageMultisample() {
  err('missing function: emscripten_glRenderbufferStorageMultisample'); abort(-1);
  }

  function _emscripten_glResetHistogram() {
  err('missing function: emscripten_glResetHistogram'); abort(-1);
  }

  function _emscripten_glResetMinmax() {
  err('missing function: emscripten_glResetMinmax'); abort(-1);
  }

  function _emscripten_glRotated() {
  err('missing function: emscripten_glRotated'); abort(-1);
  }

  function _emscripten_glRotatef() {
  err('missing function: emscripten_glRotatef'); abort(-1);
  }

  function _emscripten_glSampleCoverage(value, invert) {
      GLctx.sampleCoverage(value, !!invert);
    }

  function _emscripten_glScaled() {
  err('missing function: emscripten_glScaled'); abort(-1);
  }

  function _emscripten_glScalef() {
  err('missing function: emscripten_glScalef'); abort(-1);
  }

  function _emscripten_glScissor(x0, x1, x2, x3) { GLctx['scissor'](x0, x1, x2, x3) }

  function _emscripten_glSecondaryColor3b() {
  err('missing function: emscripten_glSecondaryColor3b'); abort(-1);
  }

  function _emscripten_glSecondaryColor3bv() {
  err('missing function: emscripten_glSecondaryColor3bv'); abort(-1);
  }

  function _emscripten_glSecondaryColor3d() {
  err('missing function: emscripten_glSecondaryColor3d'); abort(-1);
  }

  function _emscripten_glSecondaryColor3dv() {
  err('missing function: emscripten_glSecondaryColor3dv'); abort(-1);
  }

  function _emscripten_glSecondaryColor3f() {
  err('missing function: emscripten_glSecondaryColor3f'); abort(-1);
  }

  function _emscripten_glSecondaryColor3fv() {
  err('missing function: emscripten_glSecondaryColor3fv'); abort(-1);
  }

  function _emscripten_glSecondaryColor3i() {
  err('missing function: emscripten_glSecondaryColor3i'); abort(-1);
  }

  function _emscripten_glSecondaryColor3iv() {
  err('missing function: emscripten_glSecondaryColor3iv'); abort(-1);
  }

  function _emscripten_glSecondaryColor3s() {
  err('missing function: emscripten_glSecondaryColor3s'); abort(-1);
  }

  function _emscripten_glSecondaryColor3sv() {
  err('missing function: emscripten_glSecondaryColor3sv'); abort(-1);
  }

  function _emscripten_glSecondaryColor3ub() {
  err('missing function: emscripten_glSecondaryColor3ub'); abort(-1);
  }

  function _emscripten_glSecondaryColor3ubv() {
  err('missing function: emscripten_glSecondaryColor3ubv'); abort(-1);
  }

  function _emscripten_glSecondaryColor3ui() {
  err('missing function: emscripten_glSecondaryColor3ui'); abort(-1);
  }

  function _emscripten_glSecondaryColor3uiv() {
  err('missing function: emscripten_glSecondaryColor3uiv'); abort(-1);
  }

  function _emscripten_glSecondaryColor3us() {
  err('missing function: emscripten_glSecondaryColor3us'); abort(-1);
  }

  function _emscripten_glSecondaryColor3usv() {
  err('missing function: emscripten_glSecondaryColor3usv'); abort(-1);
  }

  function _emscripten_glSecondaryColorPointer() {
  err('missing function: emscripten_glSecondaryColorPointer'); abort(-1);
  }

  function _emscripten_glSelectBuffer() {
  err('missing function: emscripten_glSelectBuffer'); abort(-1);
  }

  function _emscripten_glSeparableFilter2D() {
  err('missing function: emscripten_glSeparableFilter2D'); abort(-1);
  }

  function _emscripten_glShadeModel() {
  err('missing function: emscripten_glShadeModel'); abort(-1);
  }

  function _emscripten_glShaderBinary() {
      GL.recordError(0x0500/*GL_INVALID_ENUM*/);
    }

  function _emscripten_glShaderSource(shader, count, string, length) {
      var source = GL.getSource(shader, count, string, length);
  
  
      GLctx.shaderSource(GL.shaders[shader], source);
    }

  function _emscripten_glStencilFunc(x0, x1, x2) { GLctx['stencilFunc'](x0, x1, x2) }

  function _emscripten_glStencilFuncSeparate(x0, x1, x2, x3) { GLctx['stencilFuncSeparate'](x0, x1, x2, x3) }

  function _emscripten_glStencilMask(x0) { GLctx['stencilMask'](x0) }

  function _emscripten_glStencilMaskSeparate(x0, x1) { GLctx['stencilMaskSeparate'](x0, x1) }

  function _emscripten_glStencilOp(x0, x1, x2) { GLctx['stencilOp'](x0, x1, x2) }

  function _emscripten_glStencilOpSeparate(x0, x1, x2, x3) { GLctx['stencilOpSeparate'](x0, x1, x2, x3) }

  function _emscripten_glTexBuffer() {
  err('missing function: emscripten_glTexBuffer'); abort(-1);
  }

  function _emscripten_glTexCoord1d() {
  err('missing function: emscripten_glTexCoord1d'); abort(-1);
  }

  function _emscripten_glTexCoord1dv() {
  err('missing function: emscripten_glTexCoord1dv'); abort(-1);
  }

  function _emscripten_glTexCoord1f() {
  err('missing function: emscripten_glTexCoord1f'); abort(-1);
  }

  function _emscripten_glTexCoord1fv() {
  err('missing function: emscripten_glTexCoord1fv'); abort(-1);
  }

  function _emscripten_glTexCoord1i() {
  err('missing function: emscripten_glTexCoord1i'); abort(-1);
  }

  function _emscripten_glTexCoord1iv() {
  err('missing function: emscripten_glTexCoord1iv'); abort(-1);
  }

  function _emscripten_glTexCoord1s() {
  err('missing function: emscripten_glTexCoord1s'); abort(-1);
  }

  function _emscripten_glTexCoord1sv() {
  err('missing function: emscripten_glTexCoord1sv'); abort(-1);
  }

  function _emscripten_glTexCoord2d() {
  err('missing function: emscripten_glTexCoord2d'); abort(-1);
  }

  function _emscripten_glTexCoord2dv() {
  err('missing function: emscripten_glTexCoord2dv'); abort(-1);
  }

  function _emscripten_glTexCoord2f() {
  err('missing function: emscripten_glTexCoord2f'); abort(-1);
  }

  function _emscripten_glTexCoord2fv() {
  err('missing function: emscripten_glTexCoord2fv'); abort(-1);
  }

  function _emscripten_glTexCoord2i() {
  err('missing function: emscripten_glTexCoord2i'); abort(-1);
  }

  function _emscripten_glTexCoord2iv() {
  err('missing function: emscripten_glTexCoord2iv'); abort(-1);
  }

  function _emscripten_glTexCoord2s() {
  err('missing function: emscripten_glTexCoord2s'); abort(-1);
  }

  function _emscripten_glTexCoord2sv() {
  err('missing function: emscripten_glTexCoord2sv'); abort(-1);
  }

  function _emscripten_glTexCoord3d() {
  err('missing function: emscripten_glTexCoord3d'); abort(-1);
  }

  function _emscripten_glTexCoord3dv() {
  err('missing function: emscripten_glTexCoord3dv'); abort(-1);
  }

  function _emscripten_glTexCoord3f() {
  err('missing function: emscripten_glTexCoord3f'); abort(-1);
  }

  function _emscripten_glTexCoord3fv() {
  err('missing function: emscripten_glTexCoord3fv'); abort(-1);
  }

  function _emscripten_glTexCoord3i() {
  err('missing function: emscripten_glTexCoord3i'); abort(-1);
  }

  function _emscripten_glTexCoord3iv() {
  err('missing function: emscripten_glTexCoord3iv'); abort(-1);
  }

  function _emscripten_glTexCoord3s() {
  err('missing function: emscripten_glTexCoord3s'); abort(-1);
  }

  function _emscripten_glTexCoord3sv() {
  err('missing function: emscripten_glTexCoord3sv'); abort(-1);
  }

  function _emscripten_glTexCoord4d() {
  err('missing function: emscripten_glTexCoord4d'); abort(-1);
  }

  function _emscripten_glTexCoord4dv() {
  err('missing function: emscripten_glTexCoord4dv'); abort(-1);
  }

  function _emscripten_glTexCoord4f() {
  err('missing function: emscripten_glTexCoord4f'); abort(-1);
  }

  function _emscripten_glTexCoord4fv() {
  err('missing function: emscripten_glTexCoord4fv'); abort(-1);
  }

  function _emscripten_glTexCoord4i() {
  err('missing function: emscripten_glTexCoord4i'); abort(-1);
  }

  function _emscripten_glTexCoord4iv() {
  err('missing function: emscripten_glTexCoord4iv'); abort(-1);
  }

  function _emscripten_glTexCoord4s() {
  err('missing function: emscripten_glTexCoord4s'); abort(-1);
  }

  function _emscripten_glTexCoord4sv() {
  err('missing function: emscripten_glTexCoord4sv'); abort(-1);
  }

  function _emscripten_glTexCoordPointer() {
  err('missing function: emscripten_glTexCoordPointer'); abort(-1);
  }

  function _emscripten_glTexEnvf() {
  err('missing function: emscripten_glTexEnvf'); abort(-1);
  }

  function _emscripten_glTexEnvfv() {
  err('missing function: emscripten_glTexEnvfv'); abort(-1);
  }

  function _emscripten_glTexEnvi() {
  err('missing function: emscripten_glTexEnvi'); abort(-1);
  }

  function _emscripten_glTexEnviv() {
  err('missing function: emscripten_glTexEnviv'); abort(-1);
  }

  function _emscripten_glTexGend() {
  err('missing function: emscripten_glTexGend'); abort(-1);
  }

  function _emscripten_glTexGendv() {
  err('missing function: emscripten_glTexGendv'); abort(-1);
  }

  function _emscripten_glTexGenf() {
  err('missing function: emscripten_glTexGenf'); abort(-1);
  }

  function _emscripten_glTexGenfv() {
  err('missing function: emscripten_glTexGenfv'); abort(-1);
  }

  function _emscripten_glTexGeni() {
  err('missing function: emscripten_glTexGeni'); abort(-1);
  }

  function _emscripten_glTexGeniv() {
  err('missing function: emscripten_glTexGeniv'); abort(-1);
  }

  function _emscripten_glTexImage1D() {
  err('missing function: emscripten_glTexImage1D'); abort(-1);
  }

  function _emscripten_glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
  
      var pixelData = null;
      if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat);
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
    }

  function _emscripten_glTexImage3D() {
  err('missing function: emscripten_glTexImage3D'); abort(-1);
  }

  function _emscripten_glTexParameterIiv() {
  err('missing function: emscripten_glTexParameterIiv'); abort(-1);
  }

  function _emscripten_glTexParameterIuiv() {
  err('missing function: emscripten_glTexParameterIuiv'); abort(-1);
  }

  function _emscripten_glTexParameterf(x0, x1, x2) { GLctx['texParameterf'](x0, x1, x2) }

  function _emscripten_glTexParameterfv(target, pname, params) {
      var param = HEAPF32[((params)>>2)];
      GLctx.texParameterf(target, pname, param);
    }

  function _emscripten_glTexParameteri(x0, x1, x2) { GLctx['texParameteri'](x0, x1, x2) }

  function _emscripten_glTexParameteriv(target, pname, params) {
      var param = HEAP32[((params)>>2)];
      GLctx.texParameteri(target, pname, param);
    }

  function _emscripten_glTexStorage2D() {
  err('missing function: emscripten_glTexStorage2D'); abort(-1);
  }

  function _emscripten_glTexStorage3D() {
  err('missing function: emscripten_glTexStorage3D'); abort(-1);
  }

  function _emscripten_glTexSubImage1D() {
  err('missing function: emscripten_glTexSubImage1D'); abort(-1);
  }

  function _emscripten_glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
      var pixelData = null;
      if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
    }

  function _emscripten_glTexSubImage3D() {
  err('missing function: emscripten_glTexSubImage3D'); abort(-1);
  }

  function _emscripten_glTransformFeedbackVaryings() {
  err('missing function: emscripten_glTransformFeedbackVaryings'); abort(-1);
  }

  function _emscripten_glTranslated() {
  err('missing function: emscripten_glTranslated'); abort(-1);
  }

  function _emscripten_glTranslatef() {
  err('missing function: emscripten_glTranslatef'); abort(-1);
  }

  function _emscripten_glUniform1f(location, v0) {
      GLctx.uniform1f(GL.uniforms[location], v0);
    }

  function _emscripten_glUniform1fv(location, count, value) {
  
  
      var view;
      if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[count-1];
        for (var i = 0; i < count; ++i) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*4)>>2);
      }
      GLctx.uniform1fv(GL.uniforms[location], view);
    }

  function _emscripten_glUniform1i(location, v0) {
      GLctx.uniform1i(GL.uniforms[location], v0);
    }

  function _emscripten_glUniform1iv(location, count, value) {
  
  
      GLctx.uniform1iv(GL.uniforms[location], HEAP32.subarray((value)>>2,(value+count*4)>>2));
    }

  function _emscripten_glUniform1ui() {
  err('missing function: emscripten_glUniform1ui'); abort(-1);
  }

  function _emscripten_glUniform1uiv() {
  err('missing function: emscripten_glUniform1uiv'); abort(-1);
  }

  function _emscripten_glUniform2f(location, v0, v1) {
      GLctx.uniform2f(GL.uniforms[location], v0, v1);
    }

  function _emscripten_glUniform2fv(location, count, value) {
  
  
      var view;
      if (2*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[2*count-1];
        for (var i = 0; i < 2*count; i += 2) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*8)>>2);
      }
      GLctx.uniform2fv(GL.uniforms[location], view);
    }

  function _emscripten_glUniform2i(location, v0, v1) {
      GLctx.uniform2i(GL.uniforms[location], v0, v1);
    }

  function _emscripten_glUniform2iv(location, count, value) {
  
  
      GLctx.uniform2iv(GL.uniforms[location], HEAP32.subarray((value)>>2,(value+count*8)>>2));
    }

  function _emscripten_glUniform2ui() {
  err('missing function: emscripten_glUniform2ui'); abort(-1);
  }

  function _emscripten_glUniform2uiv() {
  err('missing function: emscripten_glUniform2uiv'); abort(-1);
  }

  function _emscripten_glUniform3f(location, v0, v1, v2) {
      GLctx.uniform3f(GL.uniforms[location], v0, v1, v2);
    }

  function _emscripten_glUniform3fv(location, count, value) {
  
  
      var view;
      if (3*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[3*count-1];
        for (var i = 0; i < 3*count; i += 3) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*12)>>2);
      }
      GLctx.uniform3fv(GL.uniforms[location], view);
    }

  function _emscripten_glUniform3i(location, v0, v1, v2) {
      GLctx.uniform3i(GL.uniforms[location], v0, v1, v2);
    }

  function _emscripten_glUniform3iv(location, count, value) {
  
  
      GLctx.uniform3iv(GL.uniforms[location], HEAP32.subarray((value)>>2,(value+count*12)>>2));
    }

  function _emscripten_glUniform3ui() {
  err('missing function: emscripten_glUniform3ui'); abort(-1);
  }

  function _emscripten_glUniform3uiv() {
  err('missing function: emscripten_glUniform3uiv'); abort(-1);
  }

  function _emscripten_glUniform4f(location, v0, v1, v2, v3) {
      GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3);
    }

  function _emscripten_glUniform4fv(location, count, value) {
  
  
      var view;
      if (4*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[4*count-1];
        for (var i = 0; i < 4*count; i += 4) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*16)>>2);
      }
      GLctx.uniform4fv(GL.uniforms[location], view);
    }

  function _emscripten_glUniform4i(location, v0, v1, v2, v3) {
      GLctx.uniform4i(GL.uniforms[location], v0, v1, v2, v3);
    }

  function _emscripten_glUniform4iv(location, count, value) {
  
  
      GLctx.uniform4iv(GL.uniforms[location], HEAP32.subarray((value)>>2,(value+count*16)>>2));
    }

  function _emscripten_glUniform4ui() {
  err('missing function: emscripten_glUniform4ui'); abort(-1);
  }

  function _emscripten_glUniform4uiv() {
  err('missing function: emscripten_glUniform4uiv'); abort(-1);
  }

  function _emscripten_glUniformBlockBinding() {
  err('missing function: emscripten_glUniformBlockBinding'); abort(-1);
  }

  function _emscripten_glUniformMatrix2fv(location, count, transpose, value) {
  
  
      var view;
      if (4*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[4*count-1];
        for (var i = 0; i < 4*count; i += 4) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*16)>>2);
      }
      GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, view);
    }

  function _emscripten_glUniformMatrix2x3fv() {
  err('missing function: emscripten_glUniformMatrix2x3fv'); abort(-1);
  }

  function _emscripten_glUniformMatrix2x4fv() {
  err('missing function: emscripten_glUniformMatrix2x4fv'); abort(-1);
  }

  function _emscripten_glUniformMatrix3fv(location, count, transpose, value) {
  
  
      var view;
      if (9*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[9*count-1];
        for (var i = 0; i < 9*count; i += 9) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
          view[i+4] = HEAPF32[(((value)+(4*i+16))>>2)];
          view[i+5] = HEAPF32[(((value)+(4*i+20))>>2)];
          view[i+6] = HEAPF32[(((value)+(4*i+24))>>2)];
          view[i+7] = HEAPF32[(((value)+(4*i+28))>>2)];
          view[i+8] = HEAPF32[(((value)+(4*i+32))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*36)>>2);
      }
      GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view);
    }

  function _emscripten_glUniformMatrix3x2fv() {
  err('missing function: emscripten_glUniformMatrix3x2fv'); abort(-1);
  }

  function _emscripten_glUniformMatrix3x4fv() {
  err('missing function: emscripten_glUniformMatrix3x4fv'); abort(-1);
  }

  function _emscripten_glUniformMatrix4fv(location, count, transpose, value) {
  
  
      var view;
      if (16*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[16*count-1];
        for (var i = 0; i < 16*count; i += 16) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
          view[i+4] = HEAPF32[(((value)+(4*i+16))>>2)];
          view[i+5] = HEAPF32[(((value)+(4*i+20))>>2)];
          view[i+6] = HEAPF32[(((value)+(4*i+24))>>2)];
          view[i+7] = HEAPF32[(((value)+(4*i+28))>>2)];
          view[i+8] = HEAPF32[(((value)+(4*i+32))>>2)];
          view[i+9] = HEAPF32[(((value)+(4*i+36))>>2)];
          view[i+10] = HEAPF32[(((value)+(4*i+40))>>2)];
          view[i+11] = HEAPF32[(((value)+(4*i+44))>>2)];
          view[i+12] = HEAPF32[(((value)+(4*i+48))>>2)];
          view[i+13] = HEAPF32[(((value)+(4*i+52))>>2)];
          view[i+14] = HEAPF32[(((value)+(4*i+56))>>2)];
          view[i+15] = HEAPF32[(((value)+(4*i+60))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*64)>>2);
      }
      GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view);
    }

  function _emscripten_glUniformMatrix4x2fv() {
  err('missing function: emscripten_glUniformMatrix4x2fv'); abort(-1);
  }

  function _emscripten_glUniformMatrix4x3fv() {
  err('missing function: emscripten_glUniformMatrix4x3fv'); abort(-1);
  }

  function _emscripten_glUnmapBuffer() {
  err('missing function: emscripten_glUnmapBuffer'); abort(-1);
  }

  function _emscripten_glUseProgram(program) {
      GLctx.useProgram(program ? GL.programs[program] : null);
    }

  function _emscripten_glUseProgramObjectARB() {
  err('missing function: emscripten_glUseProgramObjectARB'); abort(-1);
  }

  function _emscripten_glValidateProgram(program) {
      GLctx.validateProgram(GL.programs[program]);
    }

  function _emscripten_glVertex2d() {
  err('missing function: emscripten_glVertex2d'); abort(-1);
  }

  function _emscripten_glVertex2dv() {
  err('missing function: emscripten_glVertex2dv'); abort(-1);
  }

  function _emscripten_glVertex2f() {
  err('missing function: emscripten_glVertex2f'); abort(-1);
  }

  function _emscripten_glVertex2fv() {
  err('missing function: emscripten_glVertex2fv'); abort(-1);
  }

  function _emscripten_glVertex2i() {
  err('missing function: emscripten_glVertex2i'); abort(-1);
  }

  function _emscripten_glVertex2iv() {
  err('missing function: emscripten_glVertex2iv'); abort(-1);
  }

  function _emscripten_glVertex2s() {
  err('missing function: emscripten_glVertex2s'); abort(-1);
  }

  function _emscripten_glVertex2sv() {
  err('missing function: emscripten_glVertex2sv'); abort(-1);
  }

  function _emscripten_glVertex3d() {
  err('missing function: emscripten_glVertex3d'); abort(-1);
  }

  function _emscripten_glVertex3dv() {
  err('missing function: emscripten_glVertex3dv'); abort(-1);
  }

  function _emscripten_glVertex3f() {
  err('missing function: emscripten_glVertex3f'); abort(-1);
  }

  function _emscripten_glVertex3fv() {
  err('missing function: emscripten_glVertex3fv'); abort(-1);
  }

  function _emscripten_glVertex3i() {
  err('missing function: emscripten_glVertex3i'); abort(-1);
  }

  function _emscripten_glVertex3iv() {
  err('missing function: emscripten_glVertex3iv'); abort(-1);
  }

  function _emscripten_glVertex3s() {
  err('missing function: emscripten_glVertex3s'); abort(-1);
  }

  function _emscripten_glVertex3sv() {
  err('missing function: emscripten_glVertex3sv'); abort(-1);
  }

  function _emscripten_glVertex4d() {
  err('missing function: emscripten_glVertex4d'); abort(-1);
  }

  function _emscripten_glVertex4dv() {
  err('missing function: emscripten_glVertex4dv'); abort(-1);
  }

  function _emscripten_glVertex4f() {
  err('missing function: emscripten_glVertex4f'); abort(-1);
  }

  function _emscripten_glVertex4fv() {
  err('missing function: emscripten_glVertex4fv'); abort(-1);
  }

  function _emscripten_glVertex4i() {
  err('missing function: emscripten_glVertex4i'); abort(-1);
  }

  function _emscripten_glVertex4iv() {
  err('missing function: emscripten_glVertex4iv'); abort(-1);
  }

  function _emscripten_glVertex4s() {
  err('missing function: emscripten_glVertex4s'); abort(-1);
  }

  function _emscripten_glVertex4sv() {
  err('missing function: emscripten_glVertex4sv'); abort(-1);
  }

  function _emscripten_glVertexAttrib1d() {
  err('missing function: emscripten_glVertexAttrib1d'); abort(-1);
  }

  function _emscripten_glVertexAttrib1dv() {
  err('missing function: emscripten_glVertexAttrib1dv'); abort(-1);
  }

  function _emscripten_glVertexAttrib1f(x0, x1) { GLctx['vertexAttrib1f'](x0, x1) }

  function _emscripten_glVertexAttrib1fv(index, v) {
  
      GLctx.vertexAttrib1f(index, HEAPF32[v>>2]);
    }

  function _emscripten_glVertexAttrib1s() {
  err('missing function: emscripten_glVertexAttrib1s'); abort(-1);
  }

  function _emscripten_glVertexAttrib1sv() {
  err('missing function: emscripten_glVertexAttrib1sv'); abort(-1);
  }

  function _emscripten_glVertexAttrib2d() {
  err('missing function: emscripten_glVertexAttrib2d'); abort(-1);
  }

  function _emscripten_glVertexAttrib2dv() {
  err('missing function: emscripten_glVertexAttrib2dv'); abort(-1);
  }

  function _emscripten_glVertexAttrib2f(x0, x1, x2) { GLctx['vertexAttrib2f'](x0, x1, x2) }

  function _emscripten_glVertexAttrib2fv(index, v) {
  
      GLctx.vertexAttrib2f(index, HEAPF32[v>>2], HEAPF32[v+4>>2]);
    }

  function _emscripten_glVertexAttrib2s() {
  err('missing function: emscripten_glVertexAttrib2s'); abort(-1);
  }

  function _emscripten_glVertexAttrib2sv() {
  err('missing function: emscripten_glVertexAttrib2sv'); abort(-1);
  }

  function _emscripten_glVertexAttrib3d() {
  err('missing function: emscripten_glVertexAttrib3d'); abort(-1);
  }

  function _emscripten_glVertexAttrib3dv() {
  err('missing function: emscripten_glVertexAttrib3dv'); abort(-1);
  }

  function _emscripten_glVertexAttrib3f(x0, x1, x2, x3) { GLctx['vertexAttrib3f'](x0, x1, x2, x3) }

  function _emscripten_glVertexAttrib3fv(index, v) {
  
      GLctx.vertexAttrib3f(index, HEAPF32[v>>2], HEAPF32[v+4>>2], HEAPF32[v+8>>2]);
    }

  function _emscripten_glVertexAttrib3s() {
  err('missing function: emscripten_glVertexAttrib3s'); abort(-1);
  }

  function _emscripten_glVertexAttrib3sv() {
  err('missing function: emscripten_glVertexAttrib3sv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4Nbv() {
  err('missing function: emscripten_glVertexAttrib4Nbv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4Niv() {
  err('missing function: emscripten_glVertexAttrib4Niv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4Nsv() {
  err('missing function: emscripten_glVertexAttrib4Nsv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4Nub() {
  err('missing function: emscripten_glVertexAttrib4Nub'); abort(-1);
  }

  function _emscripten_glVertexAttrib4Nubv() {
  err('missing function: emscripten_glVertexAttrib4Nubv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4Nuiv() {
  err('missing function: emscripten_glVertexAttrib4Nuiv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4Nusv() {
  err('missing function: emscripten_glVertexAttrib4Nusv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4bv() {
  err('missing function: emscripten_glVertexAttrib4bv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4d() {
  err('missing function: emscripten_glVertexAttrib4d'); abort(-1);
  }

  function _emscripten_glVertexAttrib4dv() {
  err('missing function: emscripten_glVertexAttrib4dv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4f(x0, x1, x2, x3, x4) { GLctx['vertexAttrib4f'](x0, x1, x2, x3, x4) }

  function _emscripten_glVertexAttrib4fv(index, v) {
  
      GLctx.vertexAttrib4f(index, HEAPF32[v>>2], HEAPF32[v+4>>2], HEAPF32[v+8>>2], HEAPF32[v+12>>2]);
    }

  function _emscripten_glVertexAttrib4iv() {
  err('missing function: emscripten_glVertexAttrib4iv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4s() {
  err('missing function: emscripten_glVertexAttrib4s'); abort(-1);
  }

  function _emscripten_glVertexAttrib4sv() {
  err('missing function: emscripten_glVertexAttrib4sv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4ubv() {
  err('missing function: emscripten_glVertexAttrib4ubv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4uiv() {
  err('missing function: emscripten_glVertexAttrib4uiv'); abort(-1);
  }

  function _emscripten_glVertexAttrib4usv() {
  err('missing function: emscripten_glVertexAttrib4usv'); abort(-1);
  }

  function _emscripten_glVertexAttribDivisor(index, divisor) {
      GLctx['vertexAttribDivisor'](index, divisor);
    }

  function _emscripten_glVertexAttribI1i() {
  err('missing function: emscripten_glVertexAttribI1i'); abort(-1);
  }

  function _emscripten_glVertexAttribI1iv() {
  err('missing function: emscripten_glVertexAttribI1iv'); abort(-1);
  }

  function _emscripten_glVertexAttribI1ui() {
  err('missing function: emscripten_glVertexAttribI1ui'); abort(-1);
  }

  function _emscripten_glVertexAttribI1uiv() {
  err('missing function: emscripten_glVertexAttribI1uiv'); abort(-1);
  }

  function _emscripten_glVertexAttribI2i() {
  err('missing function: emscripten_glVertexAttribI2i'); abort(-1);
  }

  function _emscripten_glVertexAttribI2iv() {
  err('missing function: emscripten_glVertexAttribI2iv'); abort(-1);
  }

  function _emscripten_glVertexAttribI2ui() {
  err('missing function: emscripten_glVertexAttribI2ui'); abort(-1);
  }

  function _emscripten_glVertexAttribI2uiv() {
  err('missing function: emscripten_glVertexAttribI2uiv'); abort(-1);
  }

  function _emscripten_glVertexAttribI3i() {
  err('missing function: emscripten_glVertexAttribI3i'); abort(-1);
  }

  function _emscripten_glVertexAttribI3iv() {
  err('missing function: emscripten_glVertexAttribI3iv'); abort(-1);
  }

  function _emscripten_glVertexAttribI3ui() {
  err('missing function: emscripten_glVertexAttribI3ui'); abort(-1);
  }

  function _emscripten_glVertexAttribI3uiv() {
  err('missing function: emscripten_glVertexAttribI3uiv'); abort(-1);
  }

  function _emscripten_glVertexAttribI4bv() {
  err('missing function: emscripten_glVertexAttribI4bv'); abort(-1);
  }

  function _emscripten_glVertexAttribI4i() {
  err('missing function: emscripten_glVertexAttribI4i'); abort(-1);
  }

  function _emscripten_glVertexAttribI4iv() {
  err('missing function: emscripten_glVertexAttribI4iv'); abort(-1);
  }

  function _emscripten_glVertexAttribI4sv() {
  err('missing function: emscripten_glVertexAttribI4sv'); abort(-1);
  }

  function _emscripten_glVertexAttribI4ubv() {
  err('missing function: emscripten_glVertexAttribI4ubv'); abort(-1);
  }

  function _emscripten_glVertexAttribI4ui() {
  err('missing function: emscripten_glVertexAttribI4ui'); abort(-1);
  }

  function _emscripten_glVertexAttribI4uiv() {
  err('missing function: emscripten_glVertexAttribI4uiv'); abort(-1);
  }

  function _emscripten_glVertexAttribI4usv() {
  err('missing function: emscripten_glVertexAttribI4usv'); abort(-1);
  }

  function _emscripten_glVertexAttribIPointer() {
  err('missing function: emscripten_glVertexAttribIPointer'); abort(-1);
  }

  function _emscripten_glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    }

  function _emscripten_glVertexPointer(){ throw 'Legacy GL function (glVertexPointer) called. If you want legacy GL emulation, you need to compile with -s LEGACY_GL_EMULATION=1 to enable legacy GL emulation.'; }

  function _emscripten_glViewport(x0, x1, x2, x3) { GLctx['viewport'](x0, x1, x2, x3) }

  function _emscripten_glWindowPos2d() {
  err('missing function: emscripten_glWindowPos2d'); abort(-1);
  }

  function _emscripten_glWindowPos2dv() {
  err('missing function: emscripten_glWindowPos2dv'); abort(-1);
  }

  function _emscripten_glWindowPos2f() {
  err('missing function: emscripten_glWindowPos2f'); abort(-1);
  }

  function _emscripten_glWindowPos2fv() {
  err('missing function: emscripten_glWindowPos2fv'); abort(-1);
  }

  function _emscripten_glWindowPos2i() {
  err('missing function: emscripten_glWindowPos2i'); abort(-1);
  }

  function _emscripten_glWindowPos2iv() {
  err('missing function: emscripten_glWindowPos2iv'); abort(-1);
  }

  function _emscripten_glWindowPos2s() {
  err('missing function: emscripten_glWindowPos2s'); abort(-1);
  }

  function _emscripten_glWindowPos2sv() {
  err('missing function: emscripten_glWindowPos2sv'); abort(-1);
  }

  function _emscripten_glWindowPos3d() {
  err('missing function: emscripten_glWindowPos3d'); abort(-1);
  }

  function _emscripten_glWindowPos3dv() {
  err('missing function: emscripten_glWindowPos3dv'); abort(-1);
  }

  function _emscripten_glWindowPos3f() {
  err('missing function: emscripten_glWindowPos3f'); abort(-1);
  }

  function _emscripten_glWindowPos3fv() {
  err('missing function: emscripten_glWindowPos3fv'); abort(-1);
  }

  function _emscripten_glWindowPos3i() {
  err('missing function: emscripten_glWindowPos3i'); abort(-1);
  }

  function _emscripten_glWindowPos3iv() {
  err('missing function: emscripten_glWindowPos3iv'); abort(-1);
  }

  function _emscripten_glWindowPos3s() {
  err('missing function: emscripten_glWindowPos3s'); abort(-1);
  }

  function _emscripten_glWindowPos3sv() {
  err('missing function: emscripten_glWindowPos3sv'); abort(-1);
  }

  function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
      if (!target) target = '#canvas';
      target = JSEvents.findEventTarget(target);
      if (!target) return -4;
      if (!target.requestPointerLock && !target.mozRequestPointerLock && !target.webkitRequestPointerLock && !target.msRequestPointerLock) {
        return -1;
      }
  
      var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
  
      // Queue this function call if we're not currently in an event handler and the user saw it appropriate to do so.
      if (!canPerformRequests) {
        if (deferUntilInEventHandler) {
          JSEvents.deferCall(JSEvents.requestPointerLock, 2 /* priority below fullscreen */, [target]);
          return 1;
        } else {
          return -2;
        }
      }
  
      return JSEvents.requestPointerLock(target);
    }

  function _emscripten_set_click_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerMouseEventCallback(target, userData, useCapture, callbackfunc, 4, "click", targetThread);
      return 0;
    }

  function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      if (typeof JSEvents.fullscreenEnabled() === 'undefined') return -1;
      if (!target) target = document;
      else {
        target = JSEvents.findEventTarget(target);
        if (!target) return -4;
      }
      JSEvents.registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread);
      JSEvents.registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "mozfullscreenchange", targetThread);
      JSEvents.registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
      JSEvents.registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "msfullscreenchange", targetThread);
      return 0;
    }

  function _emscripten_set_gamepadconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
      if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
      JSEvents.registerGamepadEventCallback(window, userData, useCapture, callbackfunc, 26, "gamepadconnected", targetThread);
      return 0;
    }

  function _emscripten_set_gamepaddisconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
      if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
      JSEvents.registerGamepadEventCallback(window, userData, useCapture, callbackfunc, 27, "gamepaddisconnected", targetThread);
      return 0;
   }

  function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);
      return 0;
    }


  function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
      return 0;
    }

  function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
      return 0;
    }

  function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
      return 0;
    }

  function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
      return 0;
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      exit(status);
    }function _exit(status) {
      __exit(status);
    }

  function _glActiveTexture(x0) { GLctx['activeTexture'](x0) }

  function _glAttachShader(program, shader) {
      GLctx.attachShader(GL.programs[program],
                              GL.shaders[shader]);
    }

  function _glBindAttribLocation(program, index, name) {
      name = Pointer_stringify(name);
      GLctx.bindAttribLocation(GL.programs[program], index, name);
    }

  function _glBindBuffer(target, buffer) {
      var bufferObj = buffer ? GL.buffers[buffer] : null;
  
  
      GLctx.bindBuffer(target, bufferObj);
    }

  function _glBindTexture(target, texture) {
      GLctx.bindTexture(target, texture ? GL.textures[texture] : null);
    }

  function _glBlendFunc(x0, x1) { GLctx['blendFunc'](x0, x1) }

  function _glBufferData(target, size, data, usage) {
      if (!data) {
        GLctx.bufferData(target, size, usage);
      } else {
        GLctx.bufferData(target, HEAPU8.subarray(data, data+size), usage);
      }
    }

  function _glBufferSubData(target, offset, size, data) {
      GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data+size));
    }

  function _glClear(x0) { GLctx['clear'](x0) }

  function _glClearColor(x0, x1, x2, x3) { GLctx['clearColor'](x0, x1, x2, x3) }

  function _glClearDepthf(x0) { GLctx['clearDepth'](x0) }

  function _glCompileShader(shader) {
      GLctx.compileShader(GL.shaders[shader]);
    }

  function _glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
      GLctx['compressedTexImage2D'](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray((data),(data+imageSize)) : null);
    }

  function _glCreateProgram() {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      program.name = id;
      GL.programs[id] = program;
      return id;
    }

  function _glCreateShader(shaderType) {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
      return id;
    }

  function _glCullFace(x0) { GLctx['cullFace'](x0) }

  function _glDeleteBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((buffers)+(i*4))>>2)];
        var buffer = GL.buffers[id];
  
        // From spec: "glDeleteBuffers silently ignores 0's and names that do not
        // correspond to existing buffer objects."
        if (!buffer) continue;
  
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
  
        if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
        if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
      }
    }

  function _glDeleteProgram(id) {
      if (!id) return;
      var program = GL.programs[id];
      if (!program) { // glDeleteProgram actually signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
      GL.programInfos[id] = null;
    }

  function _glDeleteShader(id) {
      if (!id) return;
      var shader = GL.shaders[id];
      if (!shader) { // glDeleteShader actually signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    }

  function _glDeleteTextures(n, textures) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((textures)+(i*4))>>2)];
        var texture = GL.textures[id];
        if (!texture) continue; // GL spec: "glDeleteTextures silently ignores 0s and names that do not correspond to existing textures".
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
      }
    }

  function _glDepthFunc(x0) { GLctx['depthFunc'](x0) }

  function _glDetachShader(program, shader) {
      GLctx.detachShader(GL.programs[program],
                              GL.shaders[shader]);
    }

  function _glDisable(x0) { GLctx['disable'](x0) }

  function _glDisableVertexAttribArray(index) {
      GLctx.disableVertexAttribArray(index);
    }

  function _glDrawArrays(mode, first, count) {
  
      GLctx.drawArrays(mode, first, count);
  
    }

  function _glDrawElements(mode, count, type, indices) {
  
      GLctx.drawElements(mode, count, type, indices);
  
    }

  function _glEnable(x0) { GLctx['enable'](x0) }

  function _glEnableVertexAttribArray(index) {
      GLctx.enableVertexAttribArray(index);
    }

  function _glFrontFace(x0) { GLctx['frontFace'](x0) }

  function _glGenBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var buffer = GLctx.createBuffer();
        if (!buffer) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((buffers)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.buffers);
        buffer.name = id;
        GL.buffers[id] = buffer;
        HEAP32[(((buffers)+(i*4))>>2)]=id;
      }
    }

  function _glGenTextures(n, textures) {
      for (var i = 0; i < n; i++) {
        var texture = GLctx.createTexture();
        if (!texture) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */); // GLES + EGL specs don't specify what should happen here, so best to issue an error and create IDs with 0.
          while(i < n) HEAP32[(((textures)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.textures);
        texture.name = id;
        GL.textures[id] = texture;
        HEAP32[(((textures)+(i*4))>>2)]=id;
      }
    }

  function _glGetAttribLocation(program, name) {
      return GLctx.getAttribLocation(GL.programs[program], Pointer_stringify(name));
    }

  function _glGetFloatv(name_, p) {
      emscriptenWebGLGet(name_, p, 'Float');
    }

  function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null) log = '(unknown error)';
  
      if (maxLength > 0 && infoLog) {
        var numBytesWrittenExclNull = stringToUTF8(log, infoLog, maxLength);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

  function _glGetProgramiv(program, pname, p) {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
  
      if (program >= GL.counter) {
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
  
      var ptable = GL.programInfos[program];
      if (!ptable) {
        GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        return;
      }
  
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)]=log.length + 1;
      } else if (pname == 0x8B87 /* GL_ACTIVE_UNIFORM_MAX_LENGTH */) {
        HEAP32[((p)>>2)]=ptable.maxUniformLength;
      } else if (pname == 0x8B8A /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */) {
        if (ptable.maxAttributeLength == -1) {
          program = GL.programs[program];
          var numAttribs = GLctx.getProgramParameter(program, GLctx.ACTIVE_ATTRIBUTES);
          ptable.maxAttributeLength = 0; // Spec says if there are no active attribs, 0 must be returned.
          for (var i = 0; i < numAttribs; ++i) {
            var activeAttrib = GLctx.getActiveAttrib(program, i);
            ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length+1);
          }
        }
        HEAP32[((p)>>2)]=ptable.maxAttributeLength;
      } else if (pname == 0x8A35 /* GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH */) {
        if (ptable.maxUniformBlockNameLength == -1) {
          program = GL.programs[program];
          var numBlocks = GLctx.getProgramParameter(program, GLctx.ACTIVE_UNIFORM_BLOCKS);
          ptable.maxUniformBlockNameLength = 0;
          for (var i = 0; i < numBlocks; ++i) {
            var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
            ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length+1);
          }
        }
        HEAP32[((p)>>2)]=ptable.maxUniformBlockNameLength;
      } else {
        HEAP32[((p)>>2)]=GLctx.getProgramParameter(GL.programs[program], pname);
      }
    }

  function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = '(unknown error)';
      if (maxLength > 0 && infoLog) {
        var numBytesWrittenExclNull = stringToUTF8(log, infoLog, maxLength);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

  function _glGetShaderiv(shader, pname, p) {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)]=log.length + 1;
      } else if (pname == 0x8B88) { // GL_SHADER_SOURCE_LENGTH
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = (source === null || source.length == 0) ? 0 : source.length + 1;
        HEAP32[((p)>>2)]=sourceLength;
      } else {
        HEAP32[((p)>>2)]=GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    }

  function _glGetString(name_) {
      if (GL.stringCache[name_]) return GL.stringCache[name_];
      var ret;
      switch(name_) {
        case 0x1F03 /* GL_EXTENSIONS */:
          var exts = GLctx.getSupportedExtensions();
          var gl_exts = [];
          for (var i = 0; i < exts.length; ++i) {
            gl_exts.push(exts[i]);
            gl_exts.push("GL_" + exts[i]);
          }
          ret = allocate(intArrayFromString(gl_exts.join(' ')), 'i8', ALLOC_NORMAL);
          break;
        case 0x1F00 /* GL_VENDOR */:
        case 0x1F01 /* GL_RENDERER */:
        case 0x9245 /* UNMASKED_VENDOR_WEBGL */:
        case 0x9246 /* UNMASKED_RENDERER_WEBGL */:
          var s = GLctx.getParameter(name_);
          if (!s) {
            GL.recordError(0x0500/*GL_INVALID_ENUM*/);
          }
          ret = allocate(intArrayFromString(s), 'i8', ALLOC_NORMAL);
          break;
  
        case 0x1F02 /* GL_VERSION */:
          var glVersion = GLctx.getParameter(GLctx.VERSION);
          // return GLES version string corresponding to the version of the WebGL context
          {
            glVersion = 'OpenGL ES 2.0 (' + glVersion + ')';
          }
          ret = allocate(intArrayFromString(glVersion), 'i8', ALLOC_NORMAL);
          break;
        case 0x8B8C /* GL_SHADING_LANGUAGE_VERSION */:
          var glslVersion = GLctx.getParameter(GLctx.SHADING_LANGUAGE_VERSION);
          // extract the version number 'N.M' from the string 'WebGL GLSL ES N.M ...'
          var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
          var ver_num = glslVersion.match(ver_re);
          if (ver_num !== null) {
            if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + '0'; // ensure minor version has 2 digits
            glslVersion = 'OpenGL ES GLSL ES ' + ver_num[1] + ' (' + glslVersion + ')';
          }
          ret = allocate(intArrayFromString(glslVersion), 'i8', ALLOC_NORMAL);
          break;
        default:
          GL.recordError(0x0500/*GL_INVALID_ENUM*/);
          return 0;
      }
      GL.stringCache[name_] = ret;
      return ret;
    }

  function _glGetUniformLocation(program, name) {
      name = Pointer_stringify(name);
  
      var arrayOffset = 0;
      // If user passed an array accessor "[index]", parse the array index off the accessor.
      if (name.indexOf(']', name.length-1) !== -1) {
        var ls = name.lastIndexOf('[');
        var arrayIndex = name.slice(ls+1, -1);
        if (arrayIndex.length > 0) {
          arrayOffset = parseInt(arrayIndex);
          if (arrayOffset < 0) {
            return -1;
          }
        }
        name = name.slice(0, ls);
      }
  
      var ptable = GL.programInfos[program];
      if (!ptable) {
        return -1;
      }
      var utable = ptable.uniforms;
      var uniformInfo = utable[name]; // returns pair [ dimension_of_uniform_array, uniform_location ]
      if (uniformInfo && arrayOffset < uniformInfo[0]) { // Check if user asked for an out-of-bounds element, i.e. for 'vec4 colors[3];' user could ask for 'colors[10]' which should return -1.
        return uniformInfo[1]+arrayOffset;
      } else {
        return -1;
      }
    }

  function _glLinkProgram(program) {
      GLctx.linkProgram(GL.programs[program]);
      GL.programInfos[program] = null; // uniforms no longer keep the same names after linking
      GL.populateUniformTable(program);
    }

  function _glPixelStorei(pname, param) {
      if (pname == 0x0D05 /* GL_PACK_ALIGNMENT */) {
        GL.packAlignment = param;
      } else if (pname == 0x0cf5 /* GL_UNPACK_ALIGNMENT */) {
        GL.unpackAlignment = param;
      }
      GLctx.pixelStorei(pname, param);
    }

  function _glShaderSource(shader, count, string, length) {
      var source = GL.getSource(shader, count, string, length);
  
  
      GLctx.shaderSource(GL.shaders[shader], source);
    }

  function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
  
      var pixelData = null;
      if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat);
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
    }

  function _glTexParameterf(x0, x1, x2) { GLctx['texParameterf'](x0, x1, x2) }

  function _glTexParameteri(x0, x1, x2) { GLctx['texParameteri'](x0, x1, x2) }

  function _glUniform1i(location, v0) {
      GLctx.uniform1i(GL.uniforms[location], v0);
    }

  function _glUniform4f(location, v0, v1, v2, v3) {
      GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3);
    }

  function _glUniformMatrix4fv(location, count, transpose, value) {
  
  
      var view;
      if (16*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[16*count-1];
        for (var i = 0; i < 16*count; i += 16) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
          view[i+4] = HEAPF32[(((value)+(4*i+16))>>2)];
          view[i+5] = HEAPF32[(((value)+(4*i+20))>>2)];
          view[i+6] = HEAPF32[(((value)+(4*i+24))>>2)];
          view[i+7] = HEAPF32[(((value)+(4*i+28))>>2)];
          view[i+8] = HEAPF32[(((value)+(4*i+32))>>2)];
          view[i+9] = HEAPF32[(((value)+(4*i+36))>>2)];
          view[i+10] = HEAPF32[(((value)+(4*i+40))>>2)];
          view[i+11] = HEAPF32[(((value)+(4*i+44))>>2)];
          view[i+12] = HEAPF32[(((value)+(4*i+48))>>2)];
          view[i+13] = HEAPF32[(((value)+(4*i+52))>>2)];
          view[i+14] = HEAPF32[(((value)+(4*i+56))>>2)];
          view[i+15] = HEAPF32[(((value)+(4*i+60))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*64)>>2);
      }
      GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view);
    }

  function _glUseProgram(program) {
      GLctx.useProgram(program ? GL.programs[program] : null);
    }

  function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    }

  function _glViewport(x0, x1, x2, x3) { GLctx['viewport'](x0, x1, x2, x3) }

  
  var GLFW={Window:function (id, width, height, title, monitor, share) {
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.fullscreen = false; // Used to determine if app in fullscreen mode
        this.storedX = 0; // Used to store X before fullscreen
        this.storedY = 0; // Used to store Y before fullscreen
        this.width = width;
        this.height = height;
        this.storedWidth = width; // Used to store width before fullscreen
        this.storedHeight = height; // Used to store height before fullscreen
        this.title = title;
        this.monitor = monitor;
        this.share = share;
        this.attributes = GLFW.hints;
        this.inputModes = {
          0x00033001:0x00034001, // GLFW_CURSOR (GLFW_CURSOR_NORMAL)
          0x00033002:0, // GLFW_STICKY_KEYS
          0x00033003:0, // GLFW_STICKY_MOUSE_BUTTONS
        };
        this.buttons = 0;
        this.keys = new Array();
        this.domKeys = new Array();
        this.shouldClose = 0;
        this.title = null;
        this.windowPosFunc = null; // GLFWwindowposfun
        this.windowSizeFunc = null; // GLFWwindowsizefun
        this.windowCloseFunc = null; // GLFWwindowclosefun
        this.windowRefreshFunc = null; // GLFWwindowrefreshfun
        this.windowFocusFunc = null; // GLFWwindowfocusfun
        this.windowIconifyFunc = null; // GLFWwindowiconifyfun
        this.framebufferSizeFunc = null; // GLFWframebuffersizefun
        this.mouseButtonFunc = null; // GLFWmousebuttonfun
        this.cursorPosFunc = null; // GLFWcursorposfun
        this.cursorEnterFunc = null; // GLFWcursorenterfun
        this.scrollFunc = null; // GLFWscrollfun
        this.dropFunc = null; // GLFWdropfun
        this.keyFunc = null; // GLFWkeyfun
        this.charFunc = null; // GLFWcharfun
        this.userptr = null;
      },WindowFromId:function (id) {
        if (id <= 0 || !GLFW.windows) return null;
        return GLFW.windows[id - 1];
      },joystickFunc:null,errorFunc:null,monitorFunc:null,active:null,windows:null,monitors:null,monitorString:null,versionString:null,initialTime:null,extensions:null,hints:null,defaultHints:{131073:0,131074:0,131075:1,131076:1,131077:1,135169:8,135170:8,135171:8,135172:8,135173:24,135174:8,135175:0,135176:0,135177:0,135178:0,135179:0,135180:0,135181:0,135182:0,135183:0,139265:196609,139266:1,139267:0,139268:0,139269:0,139270:0,139271:0,139272:0},DOMToGLFWKeyCode:function (keycode) {
        switch (keycode) {
          // these keycodes are only defined for GLFW3, assume they are the same for GLFW2
          case 0x20:return 32; // DOM_VK_SPACE -> GLFW_KEY_SPACE
          case 0xDE:return 39; // DOM_VK_QUOTE -> GLFW_KEY_APOSTROPHE
          case 0xBC:return 44; // DOM_VK_COMMA -> GLFW_KEY_COMMA
          case 0xAD:return 45; // DOM_VK_HYPHEN_MINUS -> GLFW_KEY_MINUS
          case 0xBD:return 45; // DOM_VK_MINUS -> GLFW_KEY_MINUS
          case 0xBE:return 46; // DOM_VK_PERIOD -> GLFW_KEY_PERIOD
          case 0xBF:return 47; // DOM_VK_SLASH -> GLFW_KEY_SLASH
          case 0x30:return 48; // DOM_VK_0 -> GLFW_KEY_0
          case 0x31:return 49; // DOM_VK_1 -> GLFW_KEY_1
          case 0x32:return 50; // DOM_VK_2 -> GLFW_KEY_2
          case 0x33:return 51; // DOM_VK_3 -> GLFW_KEY_3
          case 0x34:return 52; // DOM_VK_4 -> GLFW_KEY_4
          case 0x35:return 53; // DOM_VK_5 -> GLFW_KEY_5
          case 0x36:return 54; // DOM_VK_6 -> GLFW_KEY_6
          case 0x37:return 55; // DOM_VK_7 -> GLFW_KEY_7
          case 0x38:return 56; // DOM_VK_8 -> GLFW_KEY_8
          case 0x39:return 57; // DOM_VK_9 -> GLFW_KEY_9
          case 0x3B:return 59; // DOM_VK_SEMICOLON -> GLFW_KEY_SEMICOLON
          case 0x3D:return 61; // DOM_VK_EQUALS -> GLFW_KEY_EQUAL
          case 0xBB:return 61; // DOM_VK_EQUALS -> GLFW_KEY_EQUAL
          case 0x41:return 65; // DOM_VK_A -> GLFW_KEY_A
          case 0x42:return 66; // DOM_VK_B -> GLFW_KEY_B
          case 0x43:return 67; // DOM_VK_C -> GLFW_KEY_C
          case 0x44:return 68; // DOM_VK_D -> GLFW_KEY_D
          case 0x45:return 69; // DOM_VK_E -> GLFW_KEY_E
          case 0x46:return 70; // DOM_VK_F -> GLFW_KEY_F
          case 0x47:return 71; // DOM_VK_G -> GLFW_KEY_G
          case 0x48:return 72; // DOM_VK_H -> GLFW_KEY_H
          case 0x49:return 73; // DOM_VK_I -> GLFW_KEY_I
          case 0x4A:return 74; // DOM_VK_J -> GLFW_KEY_J
          case 0x4B:return 75; // DOM_VK_K -> GLFW_KEY_K
          case 0x4C:return 76; // DOM_VK_L -> GLFW_KEY_L
          case 0x4D:return 77; // DOM_VK_M -> GLFW_KEY_M
          case 0x4E:return 78; // DOM_VK_N -> GLFW_KEY_N
          case 0x4F:return 79; // DOM_VK_O -> GLFW_KEY_O
          case 0x50:return 80; // DOM_VK_P -> GLFW_KEY_P
          case 0x51:return 81; // DOM_VK_Q -> GLFW_KEY_Q
          case 0x52:return 82; // DOM_VK_R -> GLFW_KEY_R
          case 0x53:return 83; // DOM_VK_S -> GLFW_KEY_S
          case 0x54:return 84; // DOM_VK_T -> GLFW_KEY_T
          case 0x55:return 85; // DOM_VK_U -> GLFW_KEY_U
          case 0x56:return 86; // DOM_VK_V -> GLFW_KEY_V
          case 0x57:return 87; // DOM_VK_W -> GLFW_KEY_W
          case 0x58:return 88; // DOM_VK_X -> GLFW_KEY_X
          case 0x59:return 89; // DOM_VK_Y -> GLFW_KEY_Y
          case 0x5a:return 90; // DOM_VK_Z -> GLFW_KEY_Z
          case 0xDB:return 91; // DOM_VK_OPEN_BRACKET -> GLFW_KEY_LEFT_BRACKET
          case 0xDC:return 92; // DOM_VK_BACKSLASH -> GLFW_KEY_BACKSLASH
          case 0xDD:return 93; // DOM_VK_CLOSE_BRACKET -> GLFW_KEY_RIGHT_BRACKET
          case 0xC0:return 94; // DOM_VK_BACK_QUOTE -> GLFW_KEY_GRAVE_ACCENT
          
  
          case 0x1B:return 256; // DOM_VK_ESCAPE -> GLFW_KEY_ESCAPE
          case 0x0D:return 257; // DOM_VK_RETURN -> GLFW_KEY_ENTER
          case 0x09:return 258; // DOM_VK_TAB -> GLFW_KEY_TAB
          case 0x08:return 259; // DOM_VK_BACK -> GLFW_KEY_BACKSPACE
          case 0x2D:return 260; // DOM_VK_INSERT -> GLFW_KEY_INSERT
          case 0x2E:return 261; // DOM_VK_DELETE -> GLFW_KEY_DELETE
          case 0x27:return 262; // DOM_VK_RIGHT -> GLFW_KEY_RIGHT
          case 0x25:return 263; // DOM_VK_LEFT -> GLFW_KEY_LEFT
          case 0x28:return 264; // DOM_VK_DOWN -> GLFW_KEY_DOWN
          case 0x26:return 265; // DOM_VK_UP -> GLFW_KEY_UP
          case 0x21:return 266; // DOM_VK_PAGE_UP -> GLFW_KEY_PAGE_UP
          case 0x22:return 267; // DOM_VK_PAGE_DOWN -> GLFW_KEY_PAGE_DOWN
          case 0x24:return 268; // DOM_VK_HOME -> GLFW_KEY_HOME
          case 0x23:return 269; // DOM_VK_END -> GLFW_KEY_END
          case 0x14:return 280; // DOM_VK_CAPS_LOCK -> GLFW_KEY_CAPS_LOCK
          case 0x91:return 281; // DOM_VK_SCROLL_LOCK -> GLFW_KEY_SCROLL_LOCK
          case 0x90:return 282; // DOM_VK_NUM_LOCK -> GLFW_KEY_NUM_LOCK
          case 0x2C:return 283; // DOM_VK_SNAPSHOT -> GLFW_KEY_PRINT_SCREEN
          case 0x13:return 284; // DOM_VK_PAUSE -> GLFW_KEY_PAUSE
          case 0x70:return 290; // DOM_VK_F1 -> GLFW_KEY_F1
          case 0x71:return 291; // DOM_VK_F2 -> GLFW_KEY_F2
          case 0x72:return 292; // DOM_VK_F3 -> GLFW_KEY_F3
          case 0x73:return 293; // DOM_VK_F4 -> GLFW_KEY_F4
          case 0x74:return 294; // DOM_VK_F5 -> GLFW_KEY_F5
          case 0x75:return 295; // DOM_VK_F6 -> GLFW_KEY_F6
          case 0x76:return 296; // DOM_VK_F7 -> GLFW_KEY_F7
          case 0x77:return 297; // DOM_VK_F8 -> GLFW_KEY_F8
          case 0x78:return 298; // DOM_VK_F9 -> GLFW_KEY_F9
          case 0x79:return 299; // DOM_VK_F10 -> GLFW_KEY_F10
          case 0x7A:return 300; // DOM_VK_F11 -> GLFW_KEY_F11
          case 0x7B:return 301; // DOM_VK_F12 -> GLFW_KEY_F12
          case 0x7C:return 302; // DOM_VK_F13 -> GLFW_KEY_F13
          case 0x7D:return 303; // DOM_VK_F14 -> GLFW_KEY_F14
          case 0x7E:return 304; // DOM_VK_F15 -> GLFW_KEY_F15
          case 0x7F:return 305; // DOM_VK_F16 -> GLFW_KEY_F16
          case 0x80:return 306; // DOM_VK_F17 -> GLFW_KEY_F17
          case 0x81:return 307; // DOM_VK_F18 -> GLFW_KEY_F18
          case 0x82:return 308; // DOM_VK_F19 -> GLFW_KEY_F19
          case 0x83:return 309; // DOM_VK_F20 -> GLFW_KEY_F20
          case 0x84:return 310; // DOM_VK_F21 -> GLFW_KEY_F21
          case 0x85:return 311; // DOM_VK_F22 -> GLFW_KEY_F22
          case 0x86:return 312; // DOM_VK_F23 -> GLFW_KEY_F23
          case 0x87:return 313; // DOM_VK_F24 -> GLFW_KEY_F24
          case 0x88:return 314; // 0x88 (not used?) -> GLFW_KEY_F25
          case 0x60:return 320; // DOM_VK_NUMPAD0 -> GLFW_KEY_KP_0
          case 0x61:return 321; // DOM_VK_NUMPAD1 -> GLFW_KEY_KP_1
          case 0x62:return 322; // DOM_VK_NUMPAD2 -> GLFW_KEY_KP_2
          case 0x63:return 323; // DOM_VK_NUMPAD3 -> GLFW_KEY_KP_3
          case 0x64:return 324; // DOM_VK_NUMPAD4 -> GLFW_KEY_KP_4
          case 0x65:return 325; // DOM_VK_NUMPAD5 -> GLFW_KEY_KP_5
          case 0x66:return 326; // DOM_VK_NUMPAD6 -> GLFW_KEY_KP_6
          case 0x67:return 327; // DOM_VK_NUMPAD7 -> GLFW_KEY_KP_7
          case 0x68:return 328; // DOM_VK_NUMPAD8 -> GLFW_KEY_KP_8
          case 0x69:return 329; // DOM_VK_NUMPAD9 -> GLFW_KEY_KP_9
          case 0x6E:return 330; // DOM_VK_DECIMAL -> GLFW_KEY_KP_DECIMAL
          case 0x6F:return 331; // DOM_VK_DIVIDE -> GLFW_KEY_KP_DIVIDE
          case 0x6A:return 332; // DOM_VK_MULTIPLY -> GLFW_KEY_KP_MULTIPLY
          case 0x6D:return 333; // DOM_VK_SUBTRACT -> GLFW_KEY_KP_SUBTRACT
          case 0x6B:return 334; // DOM_VK_ADD -> GLFW_KEY_KP_ADD
          // case 0x0D:return 335; // DOM_VK_RETURN -> GLFW_KEY_KP_ENTER (DOM_KEY_LOCATION_RIGHT)
          // case 0x61:return 336; // DOM_VK_EQUALS -> GLFW_KEY_KP_EQUAL (DOM_KEY_LOCATION_RIGHT)
          case 0x10:return 340; // DOM_VK_SHIFT -> GLFW_KEY_LEFT_SHIFT
          case 0x11:return 341; // DOM_VK_CONTROL -> GLFW_KEY_LEFT_CONTROL
          case 0x12:return 342; // DOM_VK_ALT -> GLFW_KEY_LEFT_ALT
          case 0x5B:return 343; // DOM_VK_WIN -> GLFW_KEY_LEFT_SUPER
          // case 0x10:return 344; // DOM_VK_SHIFT -> GLFW_KEY_RIGHT_SHIFT (DOM_KEY_LOCATION_RIGHT)
          // case 0x11:return 345; // DOM_VK_CONTROL -> GLFW_KEY_RIGHT_CONTROL (DOM_KEY_LOCATION_RIGHT)
          // case 0x12:return 346; // DOM_VK_ALT -> GLFW_KEY_RIGHT_ALT (DOM_KEY_LOCATION_RIGHT)
          // case 0x5B:return 347; // DOM_VK_WIN -> GLFW_KEY_RIGHT_SUPER (DOM_KEY_LOCATION_RIGHT)
          case 0x5D:return 348; // DOM_VK_CONTEXT_MENU -> GLFW_KEY_MENU
          // XXX: GLFW_KEY_WORLD_1, GLFW_KEY_WORLD_2 what are these?
          default:return -1; // GLFW_KEY_UNKNOWN
        };
      },getModBits:function (win) {
        var mod = 0;
        if (win.keys[340]) mod |= 0x0001; // GLFW_MOD_SHIFT
        if (win.keys[341]) mod |= 0x0002; // GLFW_MOD_CONTROL
        if (win.keys[342]) mod |= 0x0004; // GLFW_MOD_ALT
        if (win.keys[343]) mod |= 0x0008; // GLFW_MOD_SUPER
        return mod;
      },onKeyPress:function (event) {
        if (!GLFW.active || !GLFW.active.charFunc) return;
        if (event.ctrlKey || event.metaKey) return;
  
        // correct unicode charCode is only available with onKeyPress event
        var charCode = event.charCode;
        if (charCode == 0 || (charCode >= 0x00 && charCode <= 0x1F)) return;
  
  
        Module['dynCall_vii'](GLFW.active.charFunc, GLFW.active.id, charCode);
      },onKeyChanged:function (keyCode, status) {
        if (!GLFW.active) return;
  
        var key = GLFW.DOMToGLFWKeyCode(keyCode);
        if (key == -1) return;
  
        var repeat = status && GLFW.active.keys[key];
        GLFW.active.keys[key] = status;
        GLFW.active.domKeys[keyCode] = status;
        if (!GLFW.active.keyFunc) return;
  
  
        if (repeat) status = 2; // GLFW_REPEAT
        Module['dynCall_viiiii'](GLFW.active.keyFunc, GLFW.active.id, key, keyCode, status, GLFW.getModBits(GLFW.active));
      },onGamepadConnected:function (event) {
        GLFW.refreshJoysticks();
      },onGamepadDisconnected:function (event) {
        GLFW.refreshJoysticks();
      },onKeydown:function (event) {
        GLFW.onKeyChanged(event.keyCode, 1); // GLFW_PRESS or GLFW_REPEAT
  
        // This logic comes directly from the sdl implementation. We cannot
        // call preventDefault on all keydown events otherwise onKeyPress will
        // not get called
        if (event.keyCode === 8 /* backspace */ || event.keyCode === 9 /* tab */) {
          event.preventDefault();
        }
      },onKeyup:function (event) {
        GLFW.onKeyChanged(event.keyCode, 0); // GLFW_RELEASE
      },onBlur:function (event) {
        if (!GLFW.active) return;
  
        for (var i = 0; i < GLFW.active.domKeys.length; ++i) {
          if (GLFW.active.domKeys[i]) {
            GLFW.onKeyChanged(i, 0); // GLFW_RELEASE
          }
        }
      },onMousemove:function (event) {
        if (!GLFW.active) return;
  
        Browser.calculateMouseEvent(event);
  
        if (event.target != Module["canvas"] || !GLFW.active.cursorPosFunc) return;
  
  
        Module['dynCall_vidd'](GLFW.active.cursorPosFunc, GLFW.active.id, Browser.mouseX, Browser.mouseY);
      },DOMToGLFWMouseButton:function (event) {
        // DOM and glfw have different button codes.
        // See http://www.w3schools.com/jsref/event_button.asp.
        var eventButton = event['button'];
        if (eventButton > 0) {
          if (eventButton == 1) {
            eventButton = 2;
          } else {
            eventButton = 1;
          }
        }
        return eventButton;
      },onMouseenter:function (event) {
        if (!GLFW.active) return;
  
        if (event.target != Module["canvas"] || !GLFW.active.cursorEnterFunc) return;
  
        Module['dynCall_vii'](GLFW.active.cursorEnterFunc, GLFW.active.id, 1);
      },onMouseleave:function (event) {
        if (!GLFW.active) return;
  
        if (event.target != Module["canvas"] || !GLFW.active.cursorEnterFunc) return;
  
        Module['dynCall_vii'](GLFW.active.cursorEnterFunc, GLFW.active.id, 0);
      },onMouseButtonChanged:function (event, status) {
        if (!GLFW.active) return;
  
        Browser.calculateMouseEvent(event);
  
        if (event.target != Module["canvas"]) return;
  
        var eventButton = GLFW.DOMToGLFWMouseButton(event);
  
        if (status == 1) { // GLFW_PRESS
          GLFW.active.buttons |= (1 << eventButton);
          try {
            event.target.setCapture();
          } catch (e) {}
        } else {  // GLFW_RELEASE
          GLFW.active.buttons &= ~(1 << eventButton);
        }
  
        if (!GLFW.active.mouseButtonFunc) return;
  
  
        Module['dynCall_viiii'](GLFW.active.mouseButtonFunc, GLFW.active.id, eventButton, status, GLFW.getModBits(GLFW.active));
      },onMouseButtonDown:function (event) {
        if (!GLFW.active) return;
        GLFW.onMouseButtonChanged(event, 1); // GLFW_PRESS
      },onMouseButtonUp:function (event) {
        if (!GLFW.active) return;
        GLFW.onMouseButtonChanged(event, 0); // GLFW_RELEASE
      },onMouseWheel:function (event) {
        // Note the minus sign that flips browser wheel direction (positive direction scrolls page down) to native wheel direction (positive direction is mouse wheel up)
        var delta = -Browser.getMouseWheelDelta(event);
        delta = (delta == 0) ? 0 : (delta > 0 ? Math.max(delta, 1) : Math.min(delta, -1)); // Quantize to integer so that minimum scroll is at least +/- 1.
        GLFW.wheelPos += delta;
  
        if (!GLFW.active || !GLFW.active.scrollFunc || event.target != Module['canvas']) return;
  
  
        var sx = 0;
        var sy = 0;
        if (event.type == 'mousewheel') {
          sx = event.wheelDeltaX;
          sy = event.wheelDeltaY;
        } else {
          sx = event.deltaX;
          sy = event.deltaY;
        }
  
        Module['dynCall_vidd'](GLFW.active.scrollFunc, GLFW.active.id, sx, sy);
  
        event.preventDefault();
      },onCanvasResize:function (width, height) {
        if (!GLFW.active) return;
  
        var resizeNeeded = true;
  
        // If the client is requesting fullscreen mode
        if (document["fullscreen"] || document["fullScreen"] || document["mozFullScreen"] || document["webkitIsFullScreen"]) {
          GLFW.active.storedX = GLFW.active.x;
          GLFW.active.storedY = GLFW.active.y;
          GLFW.active.storedWidth = GLFW.active.width;
          GLFW.active.storedHeight = GLFW.active.height;
          GLFW.active.x = GLFW.active.y = 0;
          GLFW.active.width = screen.width;
          GLFW.active.height = screen.height;
          GLFW.active.fullscreen = true;
  
        // If the client is reverting from fullscreen mode
        } else if (GLFW.active.fullscreen == true) {
          GLFW.active.x = GLFW.active.storedX;
          GLFW.active.y = GLFW.active.storedY;
          GLFW.active.width = GLFW.active.storedWidth;
          GLFW.active.height = GLFW.active.storedHeight;
          GLFW.active.fullscreen = false;
  
        // If the width/height values do not match current active window sizes
        } else if (GLFW.active.width != width || GLFW.active.height != height) {
            GLFW.active.width = width;
            GLFW.active.height = height;
        } else {
          resizeNeeded = false;
        }
  
        // If any of the above conditions were true, we need to resize the canvas
        if (resizeNeeded) {
          // resets the canvas size to counter the aspect preservation of Browser.updateCanvasDimensions
          Browser.setCanvasSize(GLFW.active.width, GLFW.active.height, true);
          // TODO: Client dimensions (clientWidth/clientHeight) vs pixel dimensions (width/height) of
          // the canvas should drive window and framebuffer size respectfully.
          GLFW.onWindowSizeChanged();
          GLFW.onFramebufferSizeChanged();
        }
      },onWindowSizeChanged:function () {
        if (!GLFW.active) return;
  
        if (!GLFW.active.windowSizeFunc) return;
  
  
        Module['dynCall_viii'](GLFW.active.windowSizeFunc, GLFW.active.id, GLFW.active.width, GLFW.active.height);
      },onFramebufferSizeChanged:function () {
        if (!GLFW.active) return;
  
        if (!GLFW.active.framebufferSizeFunc) return;
  
        Module['dynCall_viii'](GLFW.active.framebufferSizeFunc, GLFW.active.id, GLFW.active.width, GLFW.active.height);
      },requestFullscreen:function () {
        var RFS = Module["canvas"]['requestFullscreen'] ||
                  Module["canvas"]['mozRequestFullScreen'] ||
                  Module["canvas"]['webkitRequestFullScreen'] ||
                  (function() {});
        RFS.apply(Module["canvas"], []);
      },requestFullScreen:function () {
        err('GLFW.requestFullScreen() is deprecated. Please call GLFW.requestFullscreen instead.');
        GLFW.requestFullScreen = function() {
          return GLFW.requestFullscreen();
        }
        return GLFW.requestFullscreen();
      },exitFullscreen:function () {
        var CFS = document['exitFullscreen'] ||
                  document['cancelFullScreen'] ||
                  document['mozCancelFullScreen'] ||
                  document['webkitCancelFullScreen'] ||
            (function() {});
        CFS.apply(document, []);
      },cancelFullScreen:function () {
        err('GLFW.cancelFullScreen() is deprecated. Please call GLFW.exitFullscreen instead.');
        GLFW.cancelFullScreen = function() {
          return GLFW.exitFullscreen();
        }
        return GLFW.exitFullscreen();
      },getTime:function () {
        return _emscripten_get_now() / 1000;
      },setWindowTitle:function (winid, title) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
  
        win.title = Pointer_stringify(title);
        if (GLFW.active.id == win.id) {
          document.title = win.title;
        }
      },setJoystickCallback:function (cbfun) {
        GLFW.joystickFunc = cbfun;
        GLFW.refreshJoysticks();
      },joys:{},lastGamepadState:null,lastGamepadStateFrame:null,refreshJoysticks:function () {
        // Produce a new Gamepad API sample if we are ticking a new game frame, or if not using emscripten_set_main_loop() at all to drive animation.
        if (Browser.mainLoop.currentFrameNumber !== GLFW.lastGamepadStateFrame || !Browser.mainLoop.currentFrameNumber) {
          GLFW.lastGamepadState = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : null);
          GLFW.lastGamepadStateFrame = Browser.mainLoop.currentFrameNumber;
  
          for (var joy = 0; joy < GLFW.lastGamepadState.length; ++joy) {
            var gamepad = GLFW.lastGamepadState[joy];
  
            if (gamepad) {
              if (!GLFW.joys[joy]) {
                console.log('glfw joystick connected:',joy);
                GLFW.joys[joy] = {
                  id: allocate(intArrayFromString(gamepad.id), 'i8', ALLOC_NORMAL),
                  buttonsCount: gamepad.buttons.length,
                  axesCount: gamepad.axes.length,
                  buttons: allocate(new Array(gamepad.buttons.length), 'i8', ALLOC_NORMAL),
                  axes: allocate(new Array(gamepad.axes.length*4), 'float', ALLOC_NORMAL)
                };
  
                if (GLFW.joystickFunc) {
                  Module['dynCall_vii'](GLFW.joystickFunc, joy, 0x00040001); // GLFW_CONNECTED
                }
              }
  
              var data = GLFW.joys[joy];
  
              for (var i = 0; i < gamepad.buttons.length;  ++i) {
                setValue(data.buttons + i, gamepad.buttons[i].pressed, 'i8');
              }
  
              for (var i = 0; i < gamepad.axes.length; ++i) {
                setValue(data.axes + i*4, gamepad.axes[i], 'float');
              }
            } else {
              if (GLFW.joys[joy]) {
                console.log('glfw joystick disconnected',joy);
  
                if (GLFW.joystickFunc) {
                  Module['dynCall_vii'](GLFW.joystickFunc, joy, 0x00040002); // GLFW_DISCONNECTED
                }
  
                _free(GLFW.joys[joy].id);
                _free(GLFW.joys[joy].buttons);
                _free(GLFW.joys[joy].axes);
  
                delete GLFW.joys[joy];
              }
            }
          }
        }
      },setKeyCallback:function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.keyFunc = cbfun;
      },setCharCallback:function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.charFunc = cbfun;
      },setMouseButtonCallback:function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.mouseButtonFunc = cbfun;
      },setCursorPosCallback:function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.cursorPosFunc = cbfun;
      },setScrollCallback:function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.scrollFunc = cbfun;
      },setDropCallback:function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.dropFunc = cbfun;
      },onDrop:function (event) {
        if (!GLFW.active || !GLFW.active.dropFunc) return;
        if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length == 0) return;
  
        event.preventDefault();
  
        var filenames = allocate(new Array(event.dataTransfer.files.length*4), 'i8*', ALLOC_NORMAL);
        var filenamesArray = [];
        var count = event.dataTransfer.files.length;
  
        // Read and save the files to emscripten's FS
        var written = 0;
        var drop_dir = '.glfw_dropped_files';
        FS.createPath('/', drop_dir);
  
        function save(file) {
          var path = '/' + drop_dir + '/' + file.name.replace(/\//g, '_');
          var reader = new FileReader();
          reader.onloadend = function(e) {
            if (reader.readyState != 2) { // not DONE
              ++written;
              console.log('failed to read dropped file: '+file.name+': '+reader.error);
              return;
            }
  
            var data = e.target.result;
            FS.writeFile(path, new Uint8Array(data));
            if (++written === count) {
              Module['dynCall_viii'](GLFW.active.dropFunc, GLFW.active.id, count, filenames);
  
              for (var i = 0; i < filenamesArray.length; ++i) {
                _free(filenamesArray[i]);
              }
              _free(filenames);
            }
          };
          reader.readAsArrayBuffer(file);
  
          var filename = allocate(intArrayFromString(path), 'i8', ALLOC_NORMAL);
          filenamesArray.push(filename);
          setValue(filenames + i*4, filename, 'i8*');
        }
  
        for (var i = 0; i < count; ++i) {
          save(event.dataTransfer.files[i]);
        }
  
        return false;
      },onDragover:function (event) {
        if (!GLFW.active || !GLFW.active.dropFunc) return;
  
        event.preventDefault();
        return false;
      },setWindowSizeCallback:function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.windowSizeFunc = cbfun;
       
      },setWindowCloseCallback:function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.windowCloseFunc = cbfun;
      },setWindowRefreshCallback:function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.windowRefreshFunc = cbfun;
      },onClickRequestPointerLock:function (e) {
        if (!Browser.pointerLock && Module['canvas'].requestPointerLock) {
          Module['canvas'].requestPointerLock();
          e.preventDefault();
        }
      },setInputMode:function (winid, mode, value) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
  
        switch(mode) {
          case 0x00033001: { // GLFW_CURSOR
            switch(value) {
              case 0x00034001: { // GLFW_CURSOR_NORMAL
                win.inputModes[mode] = value;
                Module['canvas'].removeEventListener('click', GLFW.onClickRequestPointerLock, true);
                Module['canvas'].exitPointerLock();
                break;
              }
              case 0x00034002: { // GLFW_CURSOR_HIDDEN
                console.log("glfwSetInputMode called with GLFW_CURSOR_HIDDEN value not implemented.");
                break;
              }
              case 0x00034003: { // GLFW_CURSOR_DISABLED
                win.inputModes[mode] = value;
                Module['canvas'].addEventListener('click', GLFW.onClickRequestPointerLock, true);
                Module['canvas'].requestPointerLock();
                break;
              }
              default: {
                console.log("glfwSetInputMode called with unknown value parameter value: " + value + ".");
                break;
              }
            }
            break;
          }
          case 0x00033002: { // GLFW_STICKY_KEYS
            console.log("glfwSetInputMode called with GLFW_STICKY_KEYS mode not implemented.");
            break;
          }
          case 0x00033003: { // GLFW_STICKY_MOUSE_BUTTONS
            console.log("glfwSetInputMode called with GLFW_STICKY_MOUSE_BUTTONS mode not implemented.");
            break;
          }
          default: {
            console.log("glfwSetInputMode called with unknown mode parameter value: " + mode + ".");
            break;
          }
        }
      },getKey:function (winid, key) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return 0;
        return win.keys[key];
      },getMouseButton:function (winid, button) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return 0;
        return (win.buttons & (1 << button)) > 0;
      },getCursorPos:function (winid, x, y) {
        setValue(x, Browser.mouseX, 'double');
        setValue(y, Browser.mouseY, 'double');
      },getMousePos:function (winid, x, y) {
        setValue(x, Browser.mouseX, 'i32');
        setValue(y, Browser.mouseY, 'i32');
      },setCursorPos:function (winid, x, y) {
      },getWindowPos:function (winid, x, y) {
        var wx = 0;
        var wy = 0;
  
        var win = GLFW.WindowFromId(winid);
        if (win) {
          wx = win.x;
          wy = win.y;
        }
  
        setValue(x, wx, 'i32');
        setValue(y, wy, 'i32');
      },setWindowPos:function (winid, x, y) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.x = x;
        win.y = y;
      },getWindowSize:function (winid, width, height) {
        var ww = 0;
        var wh = 0;
  
        var win = GLFW.WindowFromId(winid);
        if (win) {
          ww = win.width;
          wh = win.height;
        }
  
        setValue(width, ww, 'i32');
        setValue(height, wh, 'i32');
      },setWindowSize:function (winid, width, height) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
  
        if (GLFW.active.id == win.id) {
          if (width == screen.width && height == screen.height) {
            GLFW.requestFullscreen();
          } else {
            GLFW.exitFullscreen();
            Browser.setCanvasSize(width, height);
            win.width = width;
            win.height = height;
          }
        }
  
        if (!win.windowSizeFunc) return;
  
  
        Module['dynCall_viii'](win.windowSizeFunc, win.id, width, height);
      },createWindow:function (width, height, title, monitor, share) {
        var i, id;
        for (i = 0; i < GLFW.windows.length && GLFW.windows[i] !== null; i++);
        if (i > 0) throw "glfwCreateWindow only supports one window at time currently";
  
        // id for window
        id = i + 1;
  
        // not valid
        if (width <= 0 || height <= 0) return 0;
  
        if (monitor) {
          GLFW.requestFullscreen();
        } else {
          Browser.setCanvasSize(width, height);
        }
  
        // Create context when there are no existing alive windows
        for (i = 0; i < GLFW.windows.length && GLFW.windows[i] == null; i++);
        if (i == GLFW.windows.length) {
          var contextAttributes = {
            antialias: (GLFW.hints[0x0002100D] > 1), // GLFW_SAMPLES
            depth: (GLFW.hints[0x00021005] > 0),     // GLFW_DEPTH_BITS
            stencil: (GLFW.hints[0x00021006] > 0),   // GLFW_STENCIL_BITS
            alpha: (GLFW.hints[0x00021004] > 0)      // GLFW_ALPHA_BITS 
          }
          Module.ctx = Browser.createContext(Module['canvas'], true, true, contextAttributes);
        }
  
        // If context creation failed, do not return a valid window
        if (!Module.ctx) return 0;
  
        // Get non alive id
        var win = new GLFW.Window(id, width, height, title, monitor, share);
  
        // Set window to array
        if (id - 1 == GLFW.windows.length) {
          GLFW.windows.push(win);
        } else {
          GLFW.windows[id - 1] = win;
        }
  
        GLFW.active = win;
        return win.id;
      },destroyWindow:function (winid) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
  
        if (win.windowCloseFunc)
          Module['dynCall_vi'](win.windowCloseFunc, win.id);
  
        GLFW.windows[win.id - 1] = null;
        if (GLFW.active.id == win.id)
          GLFW.active = null;
  
        // Destroy context when no alive windows
        for (var i = 0; i < GLFW.windows.length; i++)
          if (GLFW.windows[i] !== null) return;
  
        Module.ctx = Browser.destroyContext(Module['canvas'], true, true);
      },swapBuffers:function (winid) {
      },GLFW2ParamToGLFW3Param:function (param) {
        var table = {
          0x00030001:0, // GLFW_MOUSE_CURSOR
          0x00030002:0, // GLFW_STICKY_KEYS
          0x00030003:0, // GLFW_STICKY_MOUSE_BUTTONS
          0x00030004:0, // GLFW_SYSTEM_KEYS
          0x00030005:0, // GLFW_KEY_REPEAT
          0x00030006:0, // GLFW_AUTO_POLL_EVENTS
          0x00020001:0, // GLFW_OPENED
          0x00020002:0, // GLFW_ACTIVE
          0x00020003:0, // GLFW_ICONIFIED
          0x00020004:0, // GLFW_ACCELERATED
          0x00020005:0x00021001, // GLFW_RED_BITS
          0x00020006:0x00021002, // GLFW_GREEN_BITS
          0x00020007:0x00021003, // GLFW_BLUE_BITS
          0x00020008:0x00021004, // GLFW_ALPHA_BITS
          0x00020009:0x00021005, // GLFW_DEPTH_BITS
          0x0002000A:0x00021006, // GLFW_STENCIL_BITS
          0x0002000B:0x0002100F, // GLFW_REFRESH_RATE
          0x0002000C:0x00021007, // GLFW_ACCUM_RED_BITS
          0x0002000D:0x00021008, // GLFW_ACCUM_GREEN_BITS
          0x0002000E:0x00021009, // GLFW_ACCUM_BLUE_BITS
          0x0002000F:0x0002100A, // GLFW_ACCUM_ALPHA_BITS
          0x00020010:0x0002100B, // GLFW_AUX_BUFFERS
          0x00020011:0x0002100C, // GLFW_STEREO
          0x00020012:0, // GLFW_WINDOW_NO_RESIZE
          0x00020013:0x0002100D, // GLFW_FSAA_SAMPLES
          0x00020014:0x00022002, // GLFW_OPENGL_VERSION_MAJOR
          0x00020015:0x00022003, // GLFW_OPENGL_VERSION_MINOR
          0x00020016:0x00022006, // GLFW_OPENGL_FORWARD_COMPAT
          0x00020017:0x00022007, // GLFW_OPENGL_DEBUG_CONTEXT
          0x00020018:0x00022008, // GLFW_OPENGL_PROFILE
        };
        return table[param];
      }};function _glfwCreateWindow(width, height, title, monitor, share) {
      return GLFW.createWindow(width, height, title, monitor, share);
    }

  function _glfwDefaultWindowHints() {
      GLFW.hints = GLFW.defaultHints;
    }

  function _glfwDestroyWindow(winid) {
      return GLFW.destroyWindow(winid);
    }

  function _glfwGetCursorPos(winid, x, y) {
      GLFW.getCursorPos(winid, x, y);
    }

  function _glfwGetKey(winid, key) {
      return GLFW.getKey(winid, key);
    }

  function _glfwGetPrimaryMonitor() {
      return 1;
    }

  function _glfwGetTime() {
      return GLFW.getTime() - GLFW.initialTime;
    }

  function _glfwGetVideoModes(monitor, count) {
      setValue(count, 0, 'i32');
      return 0;
    }

  function _glfwInit() {
      if (GLFW.windows) return 1; // GL_TRUE
  
      GLFW.initialTime = GLFW.getTime();
      GLFW.hints = GLFW.defaultHints;
      GLFW.windows = new Array()
      GLFW.active = null;
  
      window.addEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
      window.addEventListener("gamepaddisconnected", GLFW.onGamepadDisconnected, true);
      window.addEventListener("keydown", GLFW.onKeydown, true);
      window.addEventListener("keypress", GLFW.onKeyPress, true);
      window.addEventListener("keyup", GLFW.onKeyup, true);
      window.addEventListener("blur", GLFW.onBlur, true);
      Module["canvas"].addEventListener("mousemove", GLFW.onMousemove, true);
      Module["canvas"].addEventListener("mousedown", GLFW.onMouseButtonDown, true);
      Module["canvas"].addEventListener("mouseup", GLFW.onMouseButtonUp, true);
      Module["canvas"].addEventListener('wheel', GLFW.onMouseWheel, true);
      Module["canvas"].addEventListener('mousewheel', GLFW.onMouseWheel, true);
      Module["canvas"].addEventListener('mouseenter', GLFW.onMouseenter, true);
      Module["canvas"].addEventListener('mouseleave', GLFW.onMouseleave, true);
      Module["canvas"].addEventListener('drop', GLFW.onDrop, true);
      Module["canvas"].addEventListener('dragover', GLFW.onDragover, true);
  
      Browser.resizeListeners.push(function(width, height) {
         GLFW.onCanvasResize(width, height);
      });
      return 1; // GL_TRUE
    }

  function _glfwMakeContextCurrent(winid) {}

  function _glfwSetCharCallback(winid, cbfun) {
      GLFW.setCharCallback(winid, cbfun);
    }

  function _glfwSetCursorEnterCallback(winid, cbfun) {
      var win = GLFW.WindowFromId(winid);
      if (!win) return;
      win.cursorEnterFunc = cbfun;
    }

  function _glfwSetCursorPosCallback(winid, cbfun) {
      GLFW.setCursorPosCallback(winid, cbfun);
    }

  function _glfwSetDropCallback(winid, cbfun) {
      GLFW.setDropCallback(winid, cbfun);
    }

  function _glfwSetErrorCallback(cbfun) {
      GLFW.errorFunc = cbfun;
    }

  function _glfwSetKeyCallback(winid, cbfun) {
      GLFW.setKeyCallback(winid, cbfun);
    }

  function _glfwSetMouseButtonCallback(winid, cbfun) {
      GLFW.setMouseButtonCallback(winid, cbfun);
    }

  function _glfwSetScrollCallback(winid, cbfun) {
      GLFW.setScrollCallback(winid, cbfun);
    }

  function _glfwSetWindowIconifyCallback(winid, cbfun) {
      var win = GLFW.WindowFromId(winid);
      if (!win) return;
      win.windowIconifyFunc = cbfun;
    }

  function _glfwSetWindowShouldClose(winid, value) {
      var win = GLFW.WindowFromId(winid);
      if (!win) return;
      win.shouldClose = value;
    }

  function _glfwSetWindowSizeCallback(winid, cbfun) {
      GLFW.setWindowSizeCallback(winid, cbfun);
    }

  function _glfwSwapBuffers(winid) {
      GLFW.swapBuffers(winid);
    }

  function _glfwSwapInterval(interval) {
      interval = Math.abs(interval); // GLFW uses negative values to enable GLX_EXT_swap_control_tear, which we don't have, so just treat negative and positive the same.
      if (interval == 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 0);
      else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, interval);
    }

  function _glfwTerminate() {
      window.removeEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
      window.removeEventListener("gamepaddisconnected", GLFW.onGamepadDisconnected, true);
      window.removeEventListener("keydown", GLFW.onKeydown, true);
      window.removeEventListener("keypress", GLFW.onKeyPress, true);
      window.removeEventListener("keyup", GLFW.onKeyup, true);
      window.removeEventListener("blur", GLFW.onBlur, true);
      Module["canvas"].removeEventListener("mousemove", GLFW.onMousemove, true);
      Module["canvas"].removeEventListener("mousedown", GLFW.onMouseButtonDown, true);
      Module["canvas"].removeEventListener("mouseup", GLFW.onMouseButtonUp, true);
      Module["canvas"].removeEventListener('wheel', GLFW.onMouseWheel, true);
      Module["canvas"].removeEventListener('mousewheel', GLFW.onMouseWheel, true);
      Module["canvas"].removeEventListener('mouseenter', GLFW.onMouseenter, true);
      Module["canvas"].removeEventListener('mouseleave', GLFW.onMouseleave, true);
      Module["canvas"].removeEventListener('drop', GLFW.onDrop, true);
      Module["canvas"].removeEventListener('dragover', GLFW.onDragover, true);
  
  
      Module["canvas"].width = Module["canvas"].height = 1;
      GLFW.windows = null;
      GLFW.active = null;
    }

  function _glfwWindowHint(target, hint) {
      GLFW.hints[target] = hint;
    }

   

  function _llvm_exp2_f32(x) {
      return Math.pow(2, x);
    }

   

  function _llvm_stackrestore(p) {
      var self = _llvm_stacksave;
      var ret = self.LLVM_SAVEDSTACKS[p];
      self.LLVM_SAVEDSTACKS.splice(p, 1);
      stackRestore(ret);
    }

  function _llvm_stacksave() {
      var self = _llvm_stacksave;
      if (!self.LLVM_SAVEDSTACKS) {
        self.LLVM_SAVEDSTACKS = [];
      }
      self.LLVM_SAVEDSTACKS.push(stackSave());
      return self.LLVM_SAVEDSTACKS.length-1;
    }

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 

   

   

  function _pthread_attr_destroy(attr) {
      /* int pthread_attr_destroy(pthread_attr_t *attr); */
      //FIXME: should destroy the pthread_attr_t struct
      return 0;
    }

  function _pthread_attr_init(attr) {
      /* int pthread_attr_init(pthread_attr_t *attr); */
      //FIXME: should allocate a pthread_attr_t
      return 0;
    }

  function _pthread_cond_destroy() { return 0; }

  function _pthread_cond_init() { return 0; }

  function _pthread_cond_signal() { return 0; }

  function _pthread_cond_wait() { return 0; }

  function _pthread_create() {
      return 11;
    }

  function _pthread_join() {}

  function _pthread_mutex_destroy() {}

  function _pthread_mutex_init() {}

   

   

   

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  function _usleep(useconds) {
      // int usleep(useconds_t useconds);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/usleep.html
      // We're single-threaded, so use a busy loop. Super-ugly.
      var msec = useconds / 1000;
      if ((ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && self['performance'] && self['performance']['now']) {
        var start = self['performance']['now']();
        while (self['performance']['now']() - start < msec) {
          // Do nothing.
        }
      } else {
        var start = Date.now();
        while (Date.now() - start < msec) {
          // Do nothing.
        }
      }
      return 0;
    }

FS.staticInit();__ATINIT__.unshift(function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() });__ATMAIN__.push(function() { FS.ignorePermissions = false });__ATEXIT__.push(function() { FS.quit() });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;Module["FS_unlink"] = FS.unlink;;
__ATINIT__.unshift(function() { TTY.init() });__ATEXIT__.push(function() { TTY.shutdown() });;
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); var NODEJS_PATH = require("path"); NODEFS.staticInit(); };
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) { err("Module.requestFullScreen is deprecated. Please call Module.requestFullscreen instead."); Module["requestFullScreen"] = Module["requestFullscreen"]; Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas, vrDevice) { Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
  Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) { return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes) };
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function _emscripten_get_now_actual() {
      var t = process['hrtime']();
      return t[0] * 1e3 + t[1] / 1e6;
    };
  } else if (typeof dateNow !== 'undefined') {
    _emscripten_get_now = dateNow;
  } else if (typeof self === 'object' && self['performance'] && typeof self['performance']['now'] === 'function') {
    _emscripten_get_now = function() { return self['performance']['now'](); };
  } else if (typeof performance === 'object' && typeof performance['now'] === 'function') {
    _emscripten_get_now = function() { return performance['now'](); };
  } else {
    _emscripten_get_now = Date.now;
  };
JSEvents.staticInit();;
var GLctx; GL.init();
DYNAMICTOP_PTR = staticAlloc(4);

STACK_BASE = STACKTOP = alignMemory(STATICTOP);

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = alignMemory(STACK_MAX);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;

staticSealed = true; // seal the static portion of memory

var ASSERTIONS = false;

// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}



Module['wasmTableSize'] = 1478;

Module['wasmMaxTableSize'] = 1478;

Module.asmGlobalArg = {};

Module.asmLibraryArg = { "abort": abort, "assert": assert, "enlargeMemory": enlargeMemory, "getTotalMemory": getTotalMemory, "setTempRet0": setTempRet0, "getTempRet0": getTempRet0, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "_SDL_CloseAudio": _SDL_CloseAudio, "_SDL_GetTicks": _SDL_GetTicks, "_SDL_InitSubSystem": _SDL_InitSubSystem, "_SDL_LockSurface": _SDL_LockSurface, "_SDL_OpenAudio": _SDL_OpenAudio, "_SDL_PauseAudio": _SDL_PauseAudio, "_SDL_QuitSubSystem": _SDL_QuitSubSystem, "_TextFormat": _TextFormat, "___assert_fail": ___assert_fail, "___lock": ___lock, "___setErrNo": ___setErrNo, "___syscall140": ___syscall140, "___syscall145": ___syscall145, "___syscall146": ___syscall146, "___syscall221": ___syscall221, "___syscall5": ___syscall5, "___syscall54": ___syscall54, "___syscall6": ___syscall6, "___unlock": ___unlock, "__emscripten_sample_gamepad_data": __emscripten_sample_gamepad_data, "__exit": __exit, "__get_canvas_element_size": __get_canvas_element_size, "__set_canvas_element_size": __set_canvas_element_size, "_eglGetProcAddress": _eglGetProcAddress, "_emscripten_exit_pointerlock": _emscripten_exit_pointerlock, "_emscripten_get_canvas_element_size": _emscripten_get_canvas_element_size, "_emscripten_get_gamepad_status": _emscripten_get_gamepad_status, "_emscripten_get_now": _emscripten_get_now, "_emscripten_get_num_gamepads": _emscripten_get_num_gamepads, "_emscripten_get_pointerlock_status": _emscripten_get_pointerlock_status, "_emscripten_glAccum": _emscripten_glAccum, "_emscripten_glActiveTexture": _emscripten_glActiveTexture, "_emscripten_glAlphaFunc": _emscripten_glAlphaFunc, "_emscripten_glAreTexturesResident": _emscripten_glAreTexturesResident, "_emscripten_glArrayElement": _emscripten_glArrayElement, "_emscripten_glAttachObjectARB": _emscripten_glAttachObjectARB, "_emscripten_glAttachShader": _emscripten_glAttachShader, "_emscripten_glBegin": _emscripten_glBegin, "_emscripten_glBeginConditionalRender": _emscripten_glBeginConditionalRender, "_emscripten_glBeginQuery": _emscripten_glBeginQuery, "_emscripten_glBeginTransformFeedback": _emscripten_glBeginTransformFeedback, "_emscripten_glBindAttribLocation": _emscripten_glBindAttribLocation, "_emscripten_glBindBuffer": _emscripten_glBindBuffer, "_emscripten_glBindBufferBase": _emscripten_glBindBufferBase, "_emscripten_glBindBufferRange": _emscripten_glBindBufferRange, "_emscripten_glBindFragDataLocation": _emscripten_glBindFragDataLocation, "_emscripten_glBindFramebuffer": _emscripten_glBindFramebuffer, "_emscripten_glBindProgramARB": _emscripten_glBindProgramARB, "_emscripten_glBindRenderbuffer": _emscripten_glBindRenderbuffer, "_emscripten_glBindTexture": _emscripten_glBindTexture, "_emscripten_glBindVertexArray": _emscripten_glBindVertexArray, "_emscripten_glBitmap": _emscripten_glBitmap, "_emscripten_glBlendColor": _emscripten_glBlendColor, "_emscripten_glBlendEquation": _emscripten_glBlendEquation, "_emscripten_glBlendEquationSeparate": _emscripten_glBlendEquationSeparate, "_emscripten_glBlendFunc": _emscripten_glBlendFunc, "_emscripten_glBlendFuncSeparate": _emscripten_glBlendFuncSeparate, "_emscripten_glBlitFramebuffer": _emscripten_glBlitFramebuffer, "_emscripten_glBufferData": _emscripten_glBufferData, "_emscripten_glBufferSubData": _emscripten_glBufferSubData, "_emscripten_glCallList": _emscripten_glCallList, "_emscripten_glCallLists": _emscripten_glCallLists, "_emscripten_glCheckFramebufferStatus": _emscripten_glCheckFramebufferStatus, "_emscripten_glClampColor": _emscripten_glClampColor, "_emscripten_glClear": _emscripten_glClear, "_emscripten_glClearAccum": _emscripten_glClearAccum, "_emscripten_glClearBufferfi": _emscripten_glClearBufferfi, "_emscripten_glClearBufferfv": _emscripten_glClearBufferfv, "_emscripten_glClearBufferiv": _emscripten_glClearBufferiv, "_emscripten_glClearBufferuiv": _emscripten_glClearBufferuiv, "_emscripten_glClearColor": _emscripten_glClearColor, "_emscripten_glClearDepth": _emscripten_glClearDepth, "_emscripten_glClearDepthf": _emscripten_glClearDepthf, "_emscripten_glClearIndex": _emscripten_glClearIndex, "_emscripten_glClearStencil": _emscripten_glClearStencil, "_emscripten_glClientActiveTexture": _emscripten_glClientActiveTexture, "_emscripten_glClipPlane": _emscripten_glClipPlane, "_emscripten_glColor3b": _emscripten_glColor3b, "_emscripten_glColor3bv": _emscripten_glColor3bv, "_emscripten_glColor3d": _emscripten_glColor3d, "_emscripten_glColor3dv": _emscripten_glColor3dv, "_emscripten_glColor3f": _emscripten_glColor3f, "_emscripten_glColor3fv": _emscripten_glColor3fv, "_emscripten_glColor3i": _emscripten_glColor3i, "_emscripten_glColor3iv": _emscripten_glColor3iv, "_emscripten_glColor3s": _emscripten_glColor3s, "_emscripten_glColor3sv": _emscripten_glColor3sv, "_emscripten_glColor3ub": _emscripten_glColor3ub, "_emscripten_glColor3ubv": _emscripten_glColor3ubv, "_emscripten_glColor3ui": _emscripten_glColor3ui, "_emscripten_glColor3uiv": _emscripten_glColor3uiv, "_emscripten_glColor3us": _emscripten_glColor3us, "_emscripten_glColor3usv": _emscripten_glColor3usv, "_emscripten_glColor4b": _emscripten_glColor4b, "_emscripten_glColor4bv": _emscripten_glColor4bv, "_emscripten_glColor4d": _emscripten_glColor4d, "_emscripten_glColor4dv": _emscripten_glColor4dv, "_emscripten_glColor4f": _emscripten_glColor4f, "_emscripten_glColor4fv": _emscripten_glColor4fv, "_emscripten_glColor4i": _emscripten_glColor4i, "_emscripten_glColor4iv": _emscripten_glColor4iv, "_emscripten_glColor4s": _emscripten_glColor4s, "_emscripten_glColor4sv": _emscripten_glColor4sv, "_emscripten_glColor4ub": _emscripten_glColor4ub, "_emscripten_glColor4ubv": _emscripten_glColor4ubv, "_emscripten_glColor4ui": _emscripten_glColor4ui, "_emscripten_glColor4uiv": _emscripten_glColor4uiv, "_emscripten_glColor4us": _emscripten_glColor4us, "_emscripten_glColor4usv": _emscripten_glColor4usv, "_emscripten_glColorMask": _emscripten_glColorMask, "_emscripten_glColorMaski": _emscripten_glColorMaski, "_emscripten_glColorMaterial": _emscripten_glColorMaterial, "_emscripten_glColorPointer": _emscripten_glColorPointer, "_emscripten_glColorSubTable": _emscripten_glColorSubTable, "_emscripten_glColorTable": _emscripten_glColorTable, "_emscripten_glColorTableParameterfv": _emscripten_glColorTableParameterfv, "_emscripten_glColorTableParameteriv": _emscripten_glColorTableParameteriv, "_emscripten_glCompileShader": _emscripten_glCompileShader, "_emscripten_glCompressedTexImage1D": _emscripten_glCompressedTexImage1D, "_emscripten_glCompressedTexImage2D": _emscripten_glCompressedTexImage2D, "_emscripten_glCompressedTexImage3D": _emscripten_glCompressedTexImage3D, "_emscripten_glCompressedTexSubImage1D": _emscripten_glCompressedTexSubImage1D, "_emscripten_glCompressedTexSubImage2D": _emscripten_glCompressedTexSubImage2D, "_emscripten_glCompressedTexSubImage3D": _emscripten_glCompressedTexSubImage3D, "_emscripten_glConvolutionFilter1D": _emscripten_glConvolutionFilter1D, "_emscripten_glConvolutionFilter2D": _emscripten_glConvolutionFilter2D, "_emscripten_glConvolutionParameterf": _emscripten_glConvolutionParameterf, "_emscripten_glConvolutionParameterfv": _emscripten_glConvolutionParameterfv, "_emscripten_glConvolutionParameteri": _emscripten_glConvolutionParameteri, "_emscripten_glConvolutionParameteriv": _emscripten_glConvolutionParameteriv, "_emscripten_glCopyColorSubTable": _emscripten_glCopyColorSubTable, "_emscripten_glCopyColorTable": _emscripten_glCopyColorTable, "_emscripten_glCopyConvolutionFilter1D": _emscripten_glCopyConvolutionFilter1D, "_emscripten_glCopyConvolutionFilter2D": _emscripten_glCopyConvolutionFilter2D, "_emscripten_glCopyPixels": _emscripten_glCopyPixels, "_emscripten_glCopyTexImage1D": _emscripten_glCopyTexImage1D, "_emscripten_glCopyTexImage2D": _emscripten_glCopyTexImage2D, "_emscripten_glCopyTexSubImage1D": _emscripten_glCopyTexSubImage1D, "_emscripten_glCopyTexSubImage2D": _emscripten_glCopyTexSubImage2D, "_emscripten_glCopyTexSubImage3D": _emscripten_glCopyTexSubImage3D, "_emscripten_glCreateProgram": _emscripten_glCreateProgram, "_emscripten_glCreateProgramObjectARB": _emscripten_glCreateProgramObjectARB, "_emscripten_glCreateShader": _emscripten_glCreateShader, "_emscripten_glCreateShaderObjectARB": _emscripten_glCreateShaderObjectARB, "_emscripten_glCullFace": _emscripten_glCullFace, "_emscripten_glDeleteBuffers": _emscripten_glDeleteBuffers, "_emscripten_glDeleteFramebuffers": _emscripten_glDeleteFramebuffers, "_emscripten_glDeleteLists": _emscripten_glDeleteLists, "_emscripten_glDeleteObjectARB": _emscripten_glDeleteObjectARB, "_emscripten_glDeleteProgram": _emscripten_glDeleteProgram, "_emscripten_glDeleteProgramsARB": _emscripten_glDeleteProgramsARB, "_emscripten_glDeleteQueries": _emscripten_glDeleteQueries, "_emscripten_glDeleteRenderbuffers": _emscripten_glDeleteRenderbuffers, "_emscripten_glDeleteShader": _emscripten_glDeleteShader, "_emscripten_glDeleteTextures": _emscripten_glDeleteTextures, "_emscripten_glDeleteVertexArrays": _emscripten_glDeleteVertexArrays, "_emscripten_glDepthFunc": _emscripten_glDepthFunc, "_emscripten_glDepthMask": _emscripten_glDepthMask, "_emscripten_glDepthRange": _emscripten_glDepthRange, "_emscripten_glDepthRangef": _emscripten_glDepthRangef, "_emscripten_glDetachObjectARB": _emscripten_glDetachObjectARB, "_emscripten_glDetachShader": _emscripten_glDetachShader, "_emscripten_glDisable": _emscripten_glDisable, "_emscripten_glDisableClientState": _emscripten_glDisableClientState, "_emscripten_glDisableVertexAttribArray": _emscripten_glDisableVertexAttribArray, "_emscripten_glDisablei": _emscripten_glDisablei, "_emscripten_glDrawArrays": _emscripten_glDrawArrays, "_emscripten_glDrawArraysInstanced": _emscripten_glDrawArraysInstanced, "_emscripten_glDrawBuffer": _emscripten_glDrawBuffer, "_emscripten_glDrawBuffers": _emscripten_glDrawBuffers, "_emscripten_glDrawElements": _emscripten_glDrawElements, "_emscripten_glDrawElementsInstanced": _emscripten_glDrawElementsInstanced, "_emscripten_glDrawPixels": _emscripten_glDrawPixels, "_emscripten_glDrawRangeElements": _emscripten_glDrawRangeElements, "_emscripten_glEdgeFlag": _emscripten_glEdgeFlag, "_emscripten_glEdgeFlagPointer": _emscripten_glEdgeFlagPointer, "_emscripten_glEdgeFlagv": _emscripten_glEdgeFlagv, "_emscripten_glEnable": _emscripten_glEnable, "_emscripten_glEnableClientState": _emscripten_glEnableClientState, "_emscripten_glEnableVertexAttribArray": _emscripten_glEnableVertexAttribArray, "_emscripten_glEnablei": _emscripten_glEnablei, "_emscripten_glEnd": _emscripten_glEnd, "_emscripten_glEndConditionalRender": _emscripten_glEndConditionalRender, "_emscripten_glEndList": _emscripten_glEndList, "_emscripten_glEndQuery": _emscripten_glEndQuery, "_emscripten_glEndTransformFeedback": _emscripten_glEndTransformFeedback, "_emscripten_glEvalCoord1d": _emscripten_glEvalCoord1d, "_emscripten_glEvalCoord1dv": _emscripten_glEvalCoord1dv, "_emscripten_glEvalCoord1f": _emscripten_glEvalCoord1f, "_emscripten_glEvalCoord1fv": _emscripten_glEvalCoord1fv, "_emscripten_glEvalCoord2d": _emscripten_glEvalCoord2d, "_emscripten_glEvalCoord2dv": _emscripten_glEvalCoord2dv, "_emscripten_glEvalCoord2f": _emscripten_glEvalCoord2f, "_emscripten_glEvalCoord2fv": _emscripten_glEvalCoord2fv, "_emscripten_glEvalMesh1": _emscripten_glEvalMesh1, "_emscripten_glEvalMesh2": _emscripten_glEvalMesh2, "_emscripten_glEvalPoint1": _emscripten_glEvalPoint1, "_emscripten_glEvalPoint2": _emscripten_glEvalPoint2, "_emscripten_glFeedbackBuffer": _emscripten_glFeedbackBuffer, "_emscripten_glFinish": _emscripten_glFinish, "_emscripten_glFlush": _emscripten_glFlush, "_emscripten_glFogCoordPointer": _emscripten_glFogCoordPointer, "_emscripten_glFogCoordd": _emscripten_glFogCoordd, "_emscripten_glFogCoorddv": _emscripten_glFogCoorddv, "_emscripten_glFogCoordf": _emscripten_glFogCoordf, "_emscripten_glFogCoordfv": _emscripten_glFogCoordfv, "_emscripten_glFogf": _emscripten_glFogf, "_emscripten_glFogfv": _emscripten_glFogfv, "_emscripten_glFogi": _emscripten_glFogi, "_emscripten_glFogiv": _emscripten_glFogiv, "_emscripten_glFramebufferRenderbuffer": _emscripten_glFramebufferRenderbuffer, "_emscripten_glFramebufferTexture1D": _emscripten_glFramebufferTexture1D, "_emscripten_glFramebufferTexture2D": _emscripten_glFramebufferTexture2D, "_emscripten_glFramebufferTexture3D": _emscripten_glFramebufferTexture3D, "_emscripten_glFramebufferTextureLayer": _emscripten_glFramebufferTextureLayer, "_emscripten_glFrontFace": _emscripten_glFrontFace, "_emscripten_glFrustum": _emscripten_glFrustum, "_emscripten_glGenBuffers": _emscripten_glGenBuffers, "_emscripten_glGenFramebuffers": _emscripten_glGenFramebuffers, "_emscripten_glGenLists": _emscripten_glGenLists, "_emscripten_glGenProgramsARB": _emscripten_glGenProgramsARB, "_emscripten_glGenQueries": _emscripten_glGenQueries, "_emscripten_glGenRenderbuffers": _emscripten_glGenRenderbuffers, "_emscripten_glGenTextures": _emscripten_glGenTextures, "_emscripten_glGenVertexArrays": _emscripten_glGenVertexArrays, "_emscripten_glGenerateMipmap": _emscripten_glGenerateMipmap, "_emscripten_glGetActiveAttrib": _emscripten_glGetActiveAttrib, "_emscripten_glGetActiveUniform": _emscripten_glGetActiveUniform, "_emscripten_glGetActiveUniformBlockName": _emscripten_glGetActiveUniformBlockName, "_emscripten_glGetActiveUniformBlockiv": _emscripten_glGetActiveUniformBlockiv, "_emscripten_glGetActiveUniformName": _emscripten_glGetActiveUniformName, "_emscripten_glGetActiveUniformsiv": _emscripten_glGetActiveUniformsiv, "_emscripten_glGetAttachedObjectsARB": _emscripten_glGetAttachedObjectsARB, "_emscripten_glGetAttachedShaders": _emscripten_glGetAttachedShaders, "_emscripten_glGetAttribLocation": _emscripten_glGetAttribLocation, "_emscripten_glGetBooleani_v": _emscripten_glGetBooleani_v, "_emscripten_glGetBooleanv": _emscripten_glGetBooleanv, "_emscripten_glGetBufferParameteriv": _emscripten_glGetBufferParameteriv, "_emscripten_glGetBufferPointerv": _emscripten_glGetBufferPointerv, "_emscripten_glGetBufferSubData": _emscripten_glGetBufferSubData, "_emscripten_glGetClipPlane": _emscripten_glGetClipPlane, "_emscripten_glGetColorTable": _emscripten_glGetColorTable, "_emscripten_glGetColorTableParameterfv": _emscripten_glGetColorTableParameterfv, "_emscripten_glGetColorTableParameteriv": _emscripten_glGetColorTableParameteriv, "_emscripten_glGetCompressedTexImage": _emscripten_glGetCompressedTexImage, "_emscripten_glGetConvolutionFilter": _emscripten_glGetConvolutionFilter, "_emscripten_glGetConvolutionParameterfv": _emscripten_glGetConvolutionParameterfv, "_emscripten_glGetConvolutionParameteriv": _emscripten_glGetConvolutionParameteriv, "_emscripten_glGetDoublev": _emscripten_glGetDoublev, "_emscripten_glGetError": _emscripten_glGetError, "_emscripten_glGetFloatv": _emscripten_glGetFloatv, "_emscripten_glGetFragDataLocation": _emscripten_glGetFragDataLocation, "_emscripten_glGetFramebufferAttachmentParameteriv": _emscripten_glGetFramebufferAttachmentParameteriv, "_emscripten_glGetHandleARB": _emscripten_glGetHandleARB, "_emscripten_glGetHistogram": _emscripten_glGetHistogram, "_emscripten_glGetHistogramParameterfv": _emscripten_glGetHistogramParameterfv, "_emscripten_glGetHistogramParameteriv": _emscripten_glGetHistogramParameteriv, "_emscripten_glGetInfoLogARB": _emscripten_glGetInfoLogARB, "_emscripten_glGetIntegeri_v": _emscripten_glGetIntegeri_v, "_emscripten_glGetIntegerv": _emscripten_glGetIntegerv, "_emscripten_glGetLightfv": _emscripten_glGetLightfv, "_emscripten_glGetLightiv": _emscripten_glGetLightiv, "_emscripten_glGetMapdv": _emscripten_glGetMapdv, "_emscripten_glGetMapfv": _emscripten_glGetMapfv, "_emscripten_glGetMapiv": _emscripten_glGetMapiv, "_emscripten_glGetMaterialfv": _emscripten_glGetMaterialfv, "_emscripten_glGetMaterialiv": _emscripten_glGetMaterialiv, "_emscripten_glGetMinmax": _emscripten_glGetMinmax, "_emscripten_glGetMinmaxParameterfv": _emscripten_glGetMinmaxParameterfv, "_emscripten_glGetMinmaxParameteriv": _emscripten_glGetMinmaxParameteriv, "_emscripten_glGetObjectParameterfvARB": _emscripten_glGetObjectParameterfvARB, "_emscripten_glGetObjectParameterivARB": _emscripten_glGetObjectParameterivARB, "_emscripten_glGetPixelMapfv": _emscripten_glGetPixelMapfv, "_emscripten_glGetPixelMapuiv": _emscripten_glGetPixelMapuiv, "_emscripten_glGetPixelMapusv": _emscripten_glGetPixelMapusv, "_emscripten_glGetPointerv": _emscripten_glGetPointerv, "_emscripten_glGetPolygonStipple": _emscripten_glGetPolygonStipple, "_emscripten_glGetProgramEnvParameterdvARB": _emscripten_glGetProgramEnvParameterdvARB, "_emscripten_glGetProgramEnvParameterfvARB": _emscripten_glGetProgramEnvParameterfvARB, "_emscripten_glGetProgramInfoLog": _emscripten_glGetProgramInfoLog, "_emscripten_glGetProgramLocalParameterdvARB": _emscripten_glGetProgramLocalParameterdvARB, "_emscripten_glGetProgramLocalParameterfvARB": _emscripten_glGetProgramLocalParameterfvARB, "_emscripten_glGetProgramStringARB": _emscripten_glGetProgramStringARB, "_emscripten_glGetProgramiv": _emscripten_glGetProgramiv, "_emscripten_glGetQueryObjectiv": _emscripten_glGetQueryObjectiv, "_emscripten_glGetQueryObjectuiv": _emscripten_glGetQueryObjectuiv, "_emscripten_glGetQueryiv": _emscripten_glGetQueryiv, "_emscripten_glGetRenderbufferParameteriv": _emscripten_glGetRenderbufferParameteriv, "_emscripten_glGetSeparableFilter": _emscripten_glGetSeparableFilter, "_emscripten_glGetShaderInfoLog": _emscripten_glGetShaderInfoLog, "_emscripten_glGetShaderPrecisionFormat": _emscripten_glGetShaderPrecisionFormat, "_emscripten_glGetShaderSource": _emscripten_glGetShaderSource, "_emscripten_glGetShaderiv": _emscripten_glGetShaderiv, "_emscripten_glGetString": _emscripten_glGetString, "_emscripten_glGetStringi": _emscripten_glGetStringi, "_emscripten_glGetTexEnvfv": _emscripten_glGetTexEnvfv, "_emscripten_glGetTexEnviv": _emscripten_glGetTexEnviv, "_emscripten_glGetTexGendv": _emscripten_glGetTexGendv, "_emscripten_glGetTexGenfv": _emscripten_glGetTexGenfv, "_emscripten_glGetTexGeniv": _emscripten_glGetTexGeniv, "_emscripten_glGetTexImage": _emscripten_glGetTexImage, "_emscripten_glGetTexLevelParameterfv": _emscripten_glGetTexLevelParameterfv, "_emscripten_glGetTexLevelParameteriv": _emscripten_glGetTexLevelParameteriv, "_emscripten_glGetTexParameterIiv": _emscripten_glGetTexParameterIiv, "_emscripten_glGetTexParameterIuiv": _emscripten_glGetTexParameterIuiv, "_emscripten_glGetTexParameterfv": _emscripten_glGetTexParameterfv, "_emscripten_glGetTexParameteriv": _emscripten_glGetTexParameteriv, "_emscripten_glGetTransformFeedbackVarying": _emscripten_glGetTransformFeedbackVarying, "_emscripten_glGetUniformBlockIndex": _emscripten_glGetUniformBlockIndex, "_emscripten_glGetUniformIndices": _emscripten_glGetUniformIndices, "_emscripten_glGetUniformLocation": _emscripten_glGetUniformLocation, "_emscripten_glGetUniformfv": _emscripten_glGetUniformfv, "_emscripten_glGetUniformiv": _emscripten_glGetUniformiv, "_emscripten_glGetUniformuiv": _emscripten_glGetUniformuiv, "_emscripten_glGetVertexAttribIiv": _emscripten_glGetVertexAttribIiv, "_emscripten_glGetVertexAttribIuiv": _emscripten_glGetVertexAttribIuiv, "_emscripten_glGetVertexAttribPointerv": _emscripten_glGetVertexAttribPointerv, "_emscripten_glGetVertexAttribdv": _emscripten_glGetVertexAttribdv, "_emscripten_glGetVertexAttribfv": _emscripten_glGetVertexAttribfv, "_emscripten_glGetVertexAttribiv": _emscripten_glGetVertexAttribiv, "_emscripten_glHint": _emscripten_glHint, "_emscripten_glHistogram": _emscripten_glHistogram, "_emscripten_glIndexMask": _emscripten_glIndexMask, "_emscripten_glIndexPointer": _emscripten_glIndexPointer, "_emscripten_glIndexd": _emscripten_glIndexd, "_emscripten_glIndexdv": _emscripten_glIndexdv, "_emscripten_glIndexf": _emscripten_glIndexf, "_emscripten_glIndexfv": _emscripten_glIndexfv, "_emscripten_glIndexi": _emscripten_glIndexi, "_emscripten_glIndexiv": _emscripten_glIndexiv, "_emscripten_glIndexs": _emscripten_glIndexs, "_emscripten_glIndexsv": _emscripten_glIndexsv, "_emscripten_glIndexub": _emscripten_glIndexub, "_emscripten_glIndexubv": _emscripten_glIndexubv, "_emscripten_glInitNames": _emscripten_glInitNames, "_emscripten_glInterleavedArrays": _emscripten_glInterleavedArrays, "_emscripten_glIsBuffer": _emscripten_glIsBuffer, "_emscripten_glIsEnabled": _emscripten_glIsEnabled, "_emscripten_glIsEnabledi": _emscripten_glIsEnabledi, "_emscripten_glIsFramebuffer": _emscripten_glIsFramebuffer, "_emscripten_glIsList": _emscripten_glIsList, "_emscripten_glIsProgram": _emscripten_glIsProgram, "_emscripten_glIsQuery": _emscripten_glIsQuery, "_emscripten_glIsRenderbuffer": _emscripten_glIsRenderbuffer, "_emscripten_glIsShader": _emscripten_glIsShader, "_emscripten_glIsTexture": _emscripten_glIsTexture, "_emscripten_glIsVertexArray": _emscripten_glIsVertexArray, "_emscripten_glLightModelf": _emscripten_glLightModelf, "_emscripten_glLightModelfv": _emscripten_glLightModelfv, "_emscripten_glLightModeli": _emscripten_glLightModeli, "_emscripten_glLightModeliv": _emscripten_glLightModeliv, "_emscripten_glLightf": _emscripten_glLightf, "_emscripten_glLightfv": _emscripten_glLightfv, "_emscripten_glLighti": _emscripten_glLighti, "_emscripten_glLightiv": _emscripten_glLightiv, "_emscripten_glLineStipple": _emscripten_glLineStipple, "_emscripten_glLineWidth": _emscripten_glLineWidth, "_emscripten_glLinkProgram": _emscripten_glLinkProgram, "_emscripten_glListBase": _emscripten_glListBase, "_emscripten_glLoadIdentity": _emscripten_glLoadIdentity, "_emscripten_glLoadMatrixd": _emscripten_glLoadMatrixd, "_emscripten_glLoadMatrixf": _emscripten_glLoadMatrixf, "_emscripten_glLoadName": _emscripten_glLoadName, "_emscripten_glLoadTransposeMatrixd": _emscripten_glLoadTransposeMatrixd, "_emscripten_glLoadTransposeMatrixf": _emscripten_glLoadTransposeMatrixf, "_emscripten_glLogicOp": _emscripten_glLogicOp, "_emscripten_glMap1d": _emscripten_glMap1d, "_emscripten_glMap1f": _emscripten_glMap1f, "_emscripten_glMap2d": _emscripten_glMap2d, "_emscripten_glMap2f": _emscripten_glMap2f, "_emscripten_glMapBuffer": _emscripten_glMapBuffer, "_emscripten_glMapGrid1d": _emscripten_glMapGrid1d, "_emscripten_glMapGrid1f": _emscripten_glMapGrid1f, "_emscripten_glMapGrid2d": _emscripten_glMapGrid2d, "_emscripten_glMapGrid2f": _emscripten_glMapGrid2f, "_emscripten_glMaterialf": _emscripten_glMaterialf, "_emscripten_glMaterialfv": _emscripten_glMaterialfv, "_emscripten_glMateriali": _emscripten_glMateriali, "_emscripten_glMaterialiv": _emscripten_glMaterialiv, "_emscripten_glMatrixMode": _emscripten_glMatrixMode, "_emscripten_glMinmax": _emscripten_glMinmax, "_emscripten_glMultMatrixd": _emscripten_glMultMatrixd, "_emscripten_glMultMatrixf": _emscripten_glMultMatrixf, "_emscripten_glMultTransposeMatrixd": _emscripten_glMultTransposeMatrixd, "_emscripten_glMultTransposeMatrixf": _emscripten_glMultTransposeMatrixf, "_emscripten_glMultiDrawArrays": _emscripten_glMultiDrawArrays, "_emscripten_glMultiDrawElements": _emscripten_glMultiDrawElements, "_emscripten_glMultiTexCoord1d": _emscripten_glMultiTexCoord1d, "_emscripten_glMultiTexCoord1dv": _emscripten_glMultiTexCoord1dv, "_emscripten_glMultiTexCoord1f": _emscripten_glMultiTexCoord1f, "_emscripten_glMultiTexCoord1fv": _emscripten_glMultiTexCoord1fv, "_emscripten_glMultiTexCoord1i": _emscripten_glMultiTexCoord1i, "_emscripten_glMultiTexCoord1iv": _emscripten_glMultiTexCoord1iv, "_emscripten_glMultiTexCoord1s": _emscripten_glMultiTexCoord1s, "_emscripten_glMultiTexCoord1sv": _emscripten_glMultiTexCoord1sv, "_emscripten_glMultiTexCoord2d": _emscripten_glMultiTexCoord2d, "_emscripten_glMultiTexCoord2dv": _emscripten_glMultiTexCoord2dv, "_emscripten_glMultiTexCoord2f": _emscripten_glMultiTexCoord2f, "_emscripten_glMultiTexCoord2fv": _emscripten_glMultiTexCoord2fv, "_emscripten_glMultiTexCoord2i": _emscripten_glMultiTexCoord2i, "_emscripten_glMultiTexCoord2iv": _emscripten_glMultiTexCoord2iv, "_emscripten_glMultiTexCoord2s": _emscripten_glMultiTexCoord2s, "_emscripten_glMultiTexCoord2sv": _emscripten_glMultiTexCoord2sv, "_emscripten_glMultiTexCoord3d": _emscripten_glMultiTexCoord3d, "_emscripten_glMultiTexCoord3dv": _emscripten_glMultiTexCoord3dv, "_emscripten_glMultiTexCoord3f": _emscripten_glMultiTexCoord3f, "_emscripten_glMultiTexCoord3fv": _emscripten_glMultiTexCoord3fv, "_emscripten_glMultiTexCoord3i": _emscripten_glMultiTexCoord3i, "_emscripten_glMultiTexCoord3iv": _emscripten_glMultiTexCoord3iv, "_emscripten_glMultiTexCoord3s": _emscripten_glMultiTexCoord3s, "_emscripten_glMultiTexCoord3sv": _emscripten_glMultiTexCoord3sv, "_emscripten_glMultiTexCoord4d": _emscripten_glMultiTexCoord4d, "_emscripten_glMultiTexCoord4dv": _emscripten_glMultiTexCoord4dv, "_emscripten_glMultiTexCoord4f": _emscripten_glMultiTexCoord4f, "_emscripten_glMultiTexCoord4fv": _emscripten_glMultiTexCoord4fv, "_emscripten_glMultiTexCoord4i": _emscripten_glMultiTexCoord4i, "_emscripten_glMultiTexCoord4iv": _emscripten_glMultiTexCoord4iv, "_emscripten_glMultiTexCoord4s": _emscripten_glMultiTexCoord4s, "_emscripten_glMultiTexCoord4sv": _emscripten_glMultiTexCoord4sv, "_emscripten_glNewList": _emscripten_glNewList, "_emscripten_glNormal3b": _emscripten_glNormal3b, "_emscripten_glNormal3bv": _emscripten_glNormal3bv, "_emscripten_glNormal3d": _emscripten_glNormal3d, "_emscripten_glNormal3dv": _emscripten_glNormal3dv, "_emscripten_glNormal3f": _emscripten_glNormal3f, "_emscripten_glNormal3fv": _emscripten_glNormal3fv, "_emscripten_glNormal3i": _emscripten_glNormal3i, "_emscripten_glNormal3iv": _emscripten_glNormal3iv, "_emscripten_glNormal3s": _emscripten_glNormal3s, "_emscripten_glNormal3sv": _emscripten_glNormal3sv, "_emscripten_glNormalPointer": _emscripten_glNormalPointer, "_emscripten_glOrtho": _emscripten_glOrtho, "_emscripten_glPassThrough": _emscripten_glPassThrough, "_emscripten_glPixelMapfv": _emscripten_glPixelMapfv, "_emscripten_glPixelMapuiv": _emscripten_glPixelMapuiv, "_emscripten_glPixelMapusv": _emscripten_glPixelMapusv, "_emscripten_glPixelStoref": _emscripten_glPixelStoref, "_emscripten_glPixelStorei": _emscripten_glPixelStorei, "_emscripten_glPixelTransferf": _emscripten_glPixelTransferf, "_emscripten_glPixelTransferi": _emscripten_glPixelTransferi, "_emscripten_glPixelZoom": _emscripten_glPixelZoom, "_emscripten_glPointParameterf": _emscripten_glPointParameterf, "_emscripten_glPointParameterfv": _emscripten_glPointParameterfv, "_emscripten_glPointParameteri": _emscripten_glPointParameteri, "_emscripten_glPointParameteriv": _emscripten_glPointParameteriv, "_emscripten_glPointSize": _emscripten_glPointSize, "_emscripten_glPolygonMode": _emscripten_glPolygonMode, "_emscripten_glPolygonOffset": _emscripten_glPolygonOffset, "_emscripten_glPolygonStipple": _emscripten_glPolygonStipple, "_emscripten_glPopAttrib": _emscripten_glPopAttrib, "_emscripten_glPopClientAttrib": _emscripten_glPopClientAttrib, "_emscripten_glPopMatrix": _emscripten_glPopMatrix, "_emscripten_glPopName": _emscripten_glPopName, "_emscripten_glPrimitiveRestartIndex": _emscripten_glPrimitiveRestartIndex, "_emscripten_glPrioritizeTextures": _emscripten_glPrioritizeTextures, "_emscripten_glProgramEnvParameter4dARB": _emscripten_glProgramEnvParameter4dARB, "_emscripten_glProgramEnvParameter4dvARB": _emscripten_glProgramEnvParameter4dvARB, "_emscripten_glProgramEnvParameter4fARB": _emscripten_glProgramEnvParameter4fARB, "_emscripten_glProgramEnvParameter4fvARB": _emscripten_glProgramEnvParameter4fvARB, "_emscripten_glProgramLocalParameter4dARB": _emscripten_glProgramLocalParameter4dARB, "_emscripten_glProgramLocalParameter4dvARB": _emscripten_glProgramLocalParameter4dvARB, "_emscripten_glProgramLocalParameter4fARB": _emscripten_glProgramLocalParameter4fARB, "_emscripten_glProgramLocalParameter4fvARB": _emscripten_glProgramLocalParameter4fvARB, "_emscripten_glProgramStringARB": _emscripten_glProgramStringARB, "_emscripten_glPushAttrib": _emscripten_glPushAttrib, "_emscripten_glPushClientAttrib": _emscripten_glPushClientAttrib, "_emscripten_glPushMatrix": _emscripten_glPushMatrix, "_emscripten_glPushName": _emscripten_glPushName, "_emscripten_glRasterPos2d": _emscripten_glRasterPos2d, "_emscripten_glRasterPos2dv": _emscripten_glRasterPos2dv, "_emscripten_glRasterPos2f": _emscripten_glRasterPos2f, "_emscripten_glRasterPos2fv": _emscripten_glRasterPos2fv, "_emscripten_glRasterPos2i": _emscripten_glRasterPos2i, "_emscripten_glRasterPos2iv": _emscripten_glRasterPos2iv, "_emscripten_glRasterPos2s": _emscripten_glRasterPos2s, "_emscripten_glRasterPos2sv": _emscripten_glRasterPos2sv, "_emscripten_glRasterPos3d": _emscripten_glRasterPos3d, "_emscripten_glRasterPos3dv": _emscripten_glRasterPos3dv, "_emscripten_glRasterPos3f": _emscripten_glRasterPos3f, "_emscripten_glRasterPos3fv": _emscripten_glRasterPos3fv, "_emscripten_glRasterPos3i": _emscripten_glRasterPos3i, "_emscripten_glRasterPos3iv": _emscripten_glRasterPos3iv, "_emscripten_glRasterPos3s": _emscripten_glRasterPos3s, "_emscripten_glRasterPos3sv": _emscripten_glRasterPos3sv, "_emscripten_glRasterPos4d": _emscripten_glRasterPos4d, "_emscripten_glRasterPos4dv": _emscripten_glRasterPos4dv, "_emscripten_glRasterPos4f": _emscripten_glRasterPos4f, "_emscripten_glRasterPos4fv": _emscripten_glRasterPos4fv, "_emscripten_glRasterPos4i": _emscripten_glRasterPos4i, "_emscripten_glRasterPos4iv": _emscripten_glRasterPos4iv, "_emscripten_glRasterPos4s": _emscripten_glRasterPos4s, "_emscripten_glRasterPos4sv": _emscripten_glRasterPos4sv, "_emscripten_glReadBuffer": _emscripten_glReadBuffer, "_emscripten_glReadPixels": _emscripten_glReadPixels, "_emscripten_glRectd": _emscripten_glRectd, "_emscripten_glRectdv": _emscripten_glRectdv, "_emscripten_glRectf": _emscripten_glRectf, "_emscripten_glRectfv": _emscripten_glRectfv, "_emscripten_glRecti": _emscripten_glRecti, "_emscripten_glRectiv": _emscripten_glRectiv, "_emscripten_glRects": _emscripten_glRects, "_emscripten_glRectsv": _emscripten_glRectsv, "_emscripten_glReleaseShaderCompiler": _emscripten_glReleaseShaderCompiler, "_emscripten_glRenderMode": _emscripten_glRenderMode, "_emscripten_glRenderbufferStorage": _emscripten_glRenderbufferStorage, "_emscripten_glRenderbufferStorageMultisample": _emscripten_glRenderbufferStorageMultisample, "_emscripten_glResetHistogram": _emscripten_glResetHistogram, "_emscripten_glResetMinmax": _emscripten_glResetMinmax, "_emscripten_glRotated": _emscripten_glRotated, "_emscripten_glRotatef": _emscripten_glRotatef, "_emscripten_glSampleCoverage": _emscripten_glSampleCoverage, "_emscripten_glScaled": _emscripten_glScaled, "_emscripten_glScalef": _emscripten_glScalef, "_emscripten_glScissor": _emscripten_glScissor, "_emscripten_glSecondaryColor3b": _emscripten_glSecondaryColor3b, "_emscripten_glSecondaryColor3bv": _emscripten_glSecondaryColor3bv, "_emscripten_glSecondaryColor3d": _emscripten_glSecondaryColor3d, "_emscripten_glSecondaryColor3dv": _emscripten_glSecondaryColor3dv, "_emscripten_glSecondaryColor3f": _emscripten_glSecondaryColor3f, "_emscripten_glSecondaryColor3fv": _emscripten_glSecondaryColor3fv, "_emscripten_glSecondaryColor3i": _emscripten_glSecondaryColor3i, "_emscripten_glSecondaryColor3iv": _emscripten_glSecondaryColor3iv, "_emscripten_glSecondaryColor3s": _emscripten_glSecondaryColor3s, "_emscripten_glSecondaryColor3sv": _emscripten_glSecondaryColor3sv, "_emscripten_glSecondaryColor3ub": _emscripten_glSecondaryColor3ub, "_emscripten_glSecondaryColor3ubv": _emscripten_glSecondaryColor3ubv, "_emscripten_glSecondaryColor3ui": _emscripten_glSecondaryColor3ui, "_emscripten_glSecondaryColor3uiv": _emscripten_glSecondaryColor3uiv, "_emscripten_glSecondaryColor3us": _emscripten_glSecondaryColor3us, "_emscripten_glSecondaryColor3usv": _emscripten_glSecondaryColor3usv, "_emscripten_glSecondaryColorPointer": _emscripten_glSecondaryColorPointer, "_emscripten_glSelectBuffer": _emscripten_glSelectBuffer, "_emscripten_glSeparableFilter2D": _emscripten_glSeparableFilter2D, "_emscripten_glShadeModel": _emscripten_glShadeModel, "_emscripten_glShaderBinary": _emscripten_glShaderBinary, "_emscripten_glShaderSource": _emscripten_glShaderSource, "_emscripten_glStencilFunc": _emscripten_glStencilFunc, "_emscripten_glStencilFuncSeparate": _emscripten_glStencilFuncSeparate, "_emscripten_glStencilMask": _emscripten_glStencilMask, "_emscripten_glStencilMaskSeparate": _emscripten_glStencilMaskSeparate, "_emscripten_glStencilOp": _emscripten_glStencilOp, "_emscripten_glStencilOpSeparate": _emscripten_glStencilOpSeparate, "_emscripten_glTexBuffer": _emscripten_glTexBuffer, "_emscripten_glTexCoord1d": _emscripten_glTexCoord1d, "_emscripten_glTexCoord1dv": _emscripten_glTexCoord1dv, "_emscripten_glTexCoord1f": _emscripten_glTexCoord1f, "_emscripten_glTexCoord1fv": _emscripten_glTexCoord1fv, "_emscripten_glTexCoord1i": _emscripten_glTexCoord1i, "_emscripten_glTexCoord1iv": _emscripten_glTexCoord1iv, "_emscripten_glTexCoord1s": _emscripten_glTexCoord1s, "_emscripten_glTexCoord1sv": _emscripten_glTexCoord1sv, "_emscripten_glTexCoord2d": _emscripten_glTexCoord2d, "_emscripten_glTexCoord2dv": _emscripten_glTexCoord2dv, "_emscripten_glTexCoord2f": _emscripten_glTexCoord2f, "_emscripten_glTexCoord2fv": _emscripten_glTexCoord2fv, "_emscripten_glTexCoord2i": _emscripten_glTexCoord2i, "_emscripten_glTexCoord2iv": _emscripten_glTexCoord2iv, "_emscripten_glTexCoord2s": _emscripten_glTexCoord2s, "_emscripten_glTexCoord2sv": _emscripten_glTexCoord2sv, "_emscripten_glTexCoord3d": _emscripten_glTexCoord3d, "_emscripten_glTexCoord3dv": _emscripten_glTexCoord3dv, "_emscripten_glTexCoord3f": _emscripten_glTexCoord3f, "_emscripten_glTexCoord3fv": _emscripten_glTexCoord3fv, "_emscripten_glTexCoord3i": _emscripten_glTexCoord3i, "_emscripten_glTexCoord3iv": _emscripten_glTexCoord3iv, "_emscripten_glTexCoord3s": _emscripten_glTexCoord3s, "_emscripten_glTexCoord3sv": _emscripten_glTexCoord3sv, "_emscripten_glTexCoord4d": _emscripten_glTexCoord4d, "_emscripten_glTexCoord4dv": _emscripten_glTexCoord4dv, "_emscripten_glTexCoord4f": _emscripten_glTexCoord4f, "_emscripten_glTexCoord4fv": _emscripten_glTexCoord4fv, "_emscripten_glTexCoord4i": _emscripten_glTexCoord4i, "_emscripten_glTexCoord4iv": _emscripten_glTexCoord4iv, "_emscripten_glTexCoord4s": _emscripten_glTexCoord4s, "_emscripten_glTexCoord4sv": _emscripten_glTexCoord4sv, "_emscripten_glTexCoordPointer": _emscripten_glTexCoordPointer, "_emscripten_glTexEnvf": _emscripten_glTexEnvf, "_emscripten_glTexEnvfv": _emscripten_glTexEnvfv, "_emscripten_glTexEnvi": _emscripten_glTexEnvi, "_emscripten_glTexEnviv": _emscripten_glTexEnviv, "_emscripten_glTexGend": _emscripten_glTexGend, "_emscripten_glTexGendv": _emscripten_glTexGendv, "_emscripten_glTexGenf": _emscripten_glTexGenf, "_emscripten_glTexGenfv": _emscripten_glTexGenfv, "_emscripten_glTexGeni": _emscripten_glTexGeni, "_emscripten_glTexGeniv": _emscripten_glTexGeniv, "_emscripten_glTexImage1D": _emscripten_glTexImage1D, "_emscripten_glTexImage2D": _emscripten_glTexImage2D, "_emscripten_glTexImage3D": _emscripten_glTexImage3D, "_emscripten_glTexParameterIiv": _emscripten_glTexParameterIiv, "_emscripten_glTexParameterIuiv": _emscripten_glTexParameterIuiv, "_emscripten_glTexParameterf": _emscripten_glTexParameterf, "_emscripten_glTexParameterfv": _emscripten_glTexParameterfv, "_emscripten_glTexParameteri": _emscripten_glTexParameteri, "_emscripten_glTexParameteriv": _emscripten_glTexParameteriv, "_emscripten_glTexStorage2D": _emscripten_glTexStorage2D, "_emscripten_glTexStorage3D": _emscripten_glTexStorage3D, "_emscripten_glTexSubImage1D": _emscripten_glTexSubImage1D, "_emscripten_glTexSubImage2D": _emscripten_glTexSubImage2D, "_emscripten_glTexSubImage3D": _emscripten_glTexSubImage3D, "_emscripten_glTransformFeedbackVaryings": _emscripten_glTransformFeedbackVaryings, "_emscripten_glTranslated": _emscripten_glTranslated, "_emscripten_glTranslatef": _emscripten_glTranslatef, "_emscripten_glUniform1f": _emscripten_glUniform1f, "_emscripten_glUniform1fv": _emscripten_glUniform1fv, "_emscripten_glUniform1i": _emscripten_glUniform1i, "_emscripten_glUniform1iv": _emscripten_glUniform1iv, "_emscripten_glUniform1ui": _emscripten_glUniform1ui, "_emscripten_glUniform1uiv": _emscripten_glUniform1uiv, "_emscripten_glUniform2f": _emscripten_glUniform2f, "_emscripten_glUniform2fv": _emscripten_glUniform2fv, "_emscripten_glUniform2i": _emscripten_glUniform2i, "_emscripten_glUniform2iv": _emscripten_glUniform2iv, "_emscripten_glUniform2ui": _emscripten_glUniform2ui, "_emscripten_glUniform2uiv": _emscripten_glUniform2uiv, "_emscripten_glUniform3f": _emscripten_glUniform3f, "_emscripten_glUniform3fv": _emscripten_glUniform3fv, "_emscripten_glUniform3i": _emscripten_glUniform3i, "_emscripten_glUniform3iv": _emscripten_glUniform3iv, "_emscripten_glUniform3ui": _emscripten_glUniform3ui, "_emscripten_glUniform3uiv": _emscripten_glUniform3uiv, "_emscripten_glUniform4f": _emscripten_glUniform4f, "_emscripten_glUniform4fv": _emscripten_glUniform4fv, "_emscripten_glUniform4i": _emscripten_glUniform4i, "_emscripten_glUniform4iv": _emscripten_glUniform4iv, "_emscripten_glUniform4ui": _emscripten_glUniform4ui, "_emscripten_glUniform4uiv": _emscripten_glUniform4uiv, "_emscripten_glUniformBlockBinding": _emscripten_glUniformBlockBinding, "_emscripten_glUniformMatrix2fv": _emscripten_glUniformMatrix2fv, "_emscripten_glUniformMatrix2x3fv": _emscripten_glUniformMatrix2x3fv, "_emscripten_glUniformMatrix2x4fv": _emscripten_glUniformMatrix2x4fv, "_emscripten_glUniformMatrix3fv": _emscripten_glUniformMatrix3fv, "_emscripten_glUniformMatrix3x2fv": _emscripten_glUniformMatrix3x2fv, "_emscripten_glUniformMatrix3x4fv": _emscripten_glUniformMatrix3x4fv, "_emscripten_glUniformMatrix4fv": _emscripten_glUniformMatrix4fv, "_emscripten_glUniformMatrix4x2fv": _emscripten_glUniformMatrix4x2fv, "_emscripten_glUniformMatrix4x3fv": _emscripten_glUniformMatrix4x3fv, "_emscripten_glUnmapBuffer": _emscripten_glUnmapBuffer, "_emscripten_glUseProgram": _emscripten_glUseProgram, "_emscripten_glUseProgramObjectARB": _emscripten_glUseProgramObjectARB, "_emscripten_glValidateProgram": _emscripten_glValidateProgram, "_emscripten_glVertex2d": _emscripten_glVertex2d, "_emscripten_glVertex2dv": _emscripten_glVertex2dv, "_emscripten_glVertex2f": _emscripten_glVertex2f, "_emscripten_glVertex2fv": _emscripten_glVertex2fv, "_emscripten_glVertex2i": _emscripten_glVertex2i, "_emscripten_glVertex2iv": _emscripten_glVertex2iv, "_emscripten_glVertex2s": _emscripten_glVertex2s, "_emscripten_glVertex2sv": _emscripten_glVertex2sv, "_emscripten_glVertex3d": _emscripten_glVertex3d, "_emscripten_glVertex3dv": _emscripten_glVertex3dv, "_emscripten_glVertex3f": _emscripten_glVertex3f, "_emscripten_glVertex3fv": _emscripten_glVertex3fv, "_emscripten_glVertex3i": _emscripten_glVertex3i, "_emscripten_glVertex3iv": _emscripten_glVertex3iv, "_emscripten_glVertex3s": _emscripten_glVertex3s, "_emscripten_glVertex3sv": _emscripten_glVertex3sv, "_emscripten_glVertex4d": _emscripten_glVertex4d, "_emscripten_glVertex4dv": _emscripten_glVertex4dv, "_emscripten_glVertex4f": _emscripten_glVertex4f, "_emscripten_glVertex4fv": _emscripten_glVertex4fv, "_emscripten_glVertex4i": _emscripten_glVertex4i, "_emscripten_glVertex4iv": _emscripten_glVertex4iv, "_emscripten_glVertex4s": _emscripten_glVertex4s, "_emscripten_glVertex4sv": _emscripten_glVertex4sv, "_emscripten_glVertexAttrib1d": _emscripten_glVertexAttrib1d, "_emscripten_glVertexAttrib1dv": _emscripten_glVertexAttrib1dv, "_emscripten_glVertexAttrib1f": _emscripten_glVertexAttrib1f, "_emscripten_glVertexAttrib1fv": _emscripten_glVertexAttrib1fv, "_emscripten_glVertexAttrib1s": _emscripten_glVertexAttrib1s, "_emscripten_glVertexAttrib1sv": _emscripten_glVertexAttrib1sv, "_emscripten_glVertexAttrib2d": _emscripten_glVertexAttrib2d, "_emscripten_glVertexAttrib2dv": _emscripten_glVertexAttrib2dv, "_emscripten_glVertexAttrib2f": _emscripten_glVertexAttrib2f, "_emscripten_glVertexAttrib2fv": _emscripten_glVertexAttrib2fv, "_emscripten_glVertexAttrib2s": _emscripten_glVertexAttrib2s, "_emscripten_glVertexAttrib2sv": _emscripten_glVertexAttrib2sv, "_emscripten_glVertexAttrib3d": _emscripten_glVertexAttrib3d, "_emscripten_glVertexAttrib3dv": _emscripten_glVertexAttrib3dv, "_emscripten_glVertexAttrib3f": _emscripten_glVertexAttrib3f, "_emscripten_glVertexAttrib3fv": _emscripten_glVertexAttrib3fv, "_emscripten_glVertexAttrib3s": _emscripten_glVertexAttrib3s, "_emscripten_glVertexAttrib3sv": _emscripten_glVertexAttrib3sv, "_emscripten_glVertexAttrib4Nbv": _emscripten_glVertexAttrib4Nbv, "_emscripten_glVertexAttrib4Niv": _emscripten_glVertexAttrib4Niv, "_emscripten_glVertexAttrib4Nsv": _emscripten_glVertexAttrib4Nsv, "_emscripten_glVertexAttrib4Nub": _emscripten_glVertexAttrib4Nub, "_emscripten_glVertexAttrib4Nubv": _emscripten_glVertexAttrib4Nubv, "_emscripten_glVertexAttrib4Nuiv": _emscripten_glVertexAttrib4Nuiv, "_emscripten_glVertexAttrib4Nusv": _emscripten_glVertexAttrib4Nusv, "_emscripten_glVertexAttrib4bv": _emscripten_glVertexAttrib4bv, "_emscripten_glVertexAttrib4d": _emscripten_glVertexAttrib4d, "_emscripten_glVertexAttrib4dv": _emscripten_glVertexAttrib4dv, "_emscripten_glVertexAttrib4f": _emscripten_glVertexAttrib4f, "_emscripten_glVertexAttrib4fv": _emscripten_glVertexAttrib4fv, "_emscripten_glVertexAttrib4iv": _emscripten_glVertexAttrib4iv, "_emscripten_glVertexAttrib4s": _emscripten_glVertexAttrib4s, "_emscripten_glVertexAttrib4sv": _emscripten_glVertexAttrib4sv, "_emscripten_glVertexAttrib4ubv": _emscripten_glVertexAttrib4ubv, "_emscripten_glVertexAttrib4uiv": _emscripten_glVertexAttrib4uiv, "_emscripten_glVertexAttrib4usv": _emscripten_glVertexAttrib4usv, "_emscripten_glVertexAttribDivisor": _emscripten_glVertexAttribDivisor, "_emscripten_glVertexAttribI1i": _emscripten_glVertexAttribI1i, "_emscripten_glVertexAttribI1iv": _emscripten_glVertexAttribI1iv, "_emscripten_glVertexAttribI1ui": _emscripten_glVertexAttribI1ui, "_emscripten_glVertexAttribI1uiv": _emscripten_glVertexAttribI1uiv, "_emscripten_glVertexAttribI2i": _emscripten_glVertexAttribI2i, "_emscripten_glVertexAttribI2iv": _emscripten_glVertexAttribI2iv, "_emscripten_glVertexAttribI2ui": _emscripten_glVertexAttribI2ui, "_emscripten_glVertexAttribI2uiv": _emscripten_glVertexAttribI2uiv, "_emscripten_glVertexAttribI3i": _emscripten_glVertexAttribI3i, "_emscripten_glVertexAttribI3iv": _emscripten_glVertexAttribI3iv, "_emscripten_glVertexAttribI3ui": _emscripten_glVertexAttribI3ui, "_emscripten_glVertexAttribI3uiv": _emscripten_glVertexAttribI3uiv, "_emscripten_glVertexAttribI4bv": _emscripten_glVertexAttribI4bv, "_emscripten_glVertexAttribI4i": _emscripten_glVertexAttribI4i, "_emscripten_glVertexAttribI4iv": _emscripten_glVertexAttribI4iv, "_emscripten_glVertexAttribI4sv": _emscripten_glVertexAttribI4sv, "_emscripten_glVertexAttribI4ubv": _emscripten_glVertexAttribI4ubv, "_emscripten_glVertexAttribI4ui": _emscripten_glVertexAttribI4ui, "_emscripten_glVertexAttribI4uiv": _emscripten_glVertexAttribI4uiv, "_emscripten_glVertexAttribI4usv": _emscripten_glVertexAttribI4usv, "_emscripten_glVertexAttribIPointer": _emscripten_glVertexAttribIPointer, "_emscripten_glVertexAttribPointer": _emscripten_glVertexAttribPointer, "_emscripten_glVertexPointer": _emscripten_glVertexPointer, "_emscripten_glViewport": _emscripten_glViewport, "_emscripten_glWindowPos2d": _emscripten_glWindowPos2d, "_emscripten_glWindowPos2dv": _emscripten_glWindowPos2dv, "_emscripten_glWindowPos2f": _emscripten_glWindowPos2f, "_emscripten_glWindowPos2fv": _emscripten_glWindowPos2fv, "_emscripten_glWindowPos2i": _emscripten_glWindowPos2i, "_emscripten_glWindowPos2iv": _emscripten_glWindowPos2iv, "_emscripten_glWindowPos2s": _emscripten_glWindowPos2s, "_emscripten_glWindowPos2sv": _emscripten_glWindowPos2sv, "_emscripten_glWindowPos3d": _emscripten_glWindowPos3d, "_emscripten_glWindowPos3dv": _emscripten_glWindowPos3dv, "_emscripten_glWindowPos3f": _emscripten_glWindowPos3f, "_emscripten_glWindowPos3fv": _emscripten_glWindowPos3fv, "_emscripten_glWindowPos3i": _emscripten_glWindowPos3i, "_emscripten_glWindowPos3iv": _emscripten_glWindowPos3iv, "_emscripten_glWindowPos3s": _emscripten_glWindowPos3s, "_emscripten_glWindowPos3sv": _emscripten_glWindowPos3sv, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_emscripten_request_pointerlock": _emscripten_request_pointerlock, "_emscripten_set_canvas_element_size": _emscripten_set_canvas_element_size, "_emscripten_set_click_callback_on_thread": _emscripten_set_click_callback_on_thread, "_emscripten_set_fullscreenchange_callback_on_thread": _emscripten_set_fullscreenchange_callback_on_thread, "_emscripten_set_gamepadconnected_callback_on_thread": _emscripten_set_gamepadconnected_callback_on_thread, "_emscripten_set_gamepaddisconnected_callback_on_thread": _emscripten_set_gamepaddisconnected_callback_on_thread, "_emscripten_set_keypress_callback_on_thread": _emscripten_set_keypress_callback_on_thread, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing, "_emscripten_set_touchcancel_callback_on_thread": _emscripten_set_touchcancel_callback_on_thread, "_emscripten_set_touchend_callback_on_thread": _emscripten_set_touchend_callback_on_thread, "_emscripten_set_touchmove_callback_on_thread": _emscripten_set_touchmove_callback_on_thread, "_emscripten_set_touchstart_callback_on_thread": _emscripten_set_touchstart_callback_on_thread, "_exit": _exit, "_glActiveTexture": _glActiveTexture, "_glAttachShader": _glAttachShader, "_glBindAttribLocation": _glBindAttribLocation, "_glBindBuffer": _glBindBuffer, "_glBindTexture": _glBindTexture, "_glBlendFunc": _glBlendFunc, "_glBufferData": _glBufferData, "_glBufferSubData": _glBufferSubData, "_glClear": _glClear, "_glClearColor": _glClearColor, "_glClearDepthf": _glClearDepthf, "_glCompileShader": _glCompileShader, "_glCompressedTexImage2D": _glCompressedTexImage2D, "_glCreateProgram": _glCreateProgram, "_glCreateShader": _glCreateShader, "_glCullFace": _glCullFace, "_glDeleteBuffers": _glDeleteBuffers, "_glDeleteProgram": _glDeleteProgram, "_glDeleteShader": _glDeleteShader, "_glDeleteTextures": _glDeleteTextures, "_glDepthFunc": _glDepthFunc, "_glDetachShader": _glDetachShader, "_glDisable": _glDisable, "_glDisableVertexAttribArray": _glDisableVertexAttribArray, "_glDrawArrays": _glDrawArrays, "_glDrawElements": _glDrawElements, "_glEnable": _glEnable, "_glEnableVertexAttribArray": _glEnableVertexAttribArray, "_glFrontFace": _glFrontFace, "_glGenBuffers": _glGenBuffers, "_glGenTextures": _glGenTextures, "_glGetAttribLocation": _glGetAttribLocation, "_glGetFloatv": _glGetFloatv, "_glGetProgramInfoLog": _glGetProgramInfoLog, "_glGetProgramiv": _glGetProgramiv, "_glGetShaderInfoLog": _glGetShaderInfoLog, "_glGetShaderiv": _glGetShaderiv, "_glGetString": _glGetString, "_glGetUniformLocation": _glGetUniformLocation, "_glLinkProgram": _glLinkProgram, "_glPixelStorei": _glPixelStorei, "_glShaderSource": _glShaderSource, "_glTexImage2D": _glTexImage2D, "_glTexParameterf": _glTexParameterf, "_glTexParameteri": _glTexParameteri, "_glUniform1i": _glUniform1i, "_glUniform4f": _glUniform4f, "_glUniformMatrix4fv": _glUniformMatrix4fv, "_glUseProgram": _glUseProgram, "_glVertexAttribPointer": _glVertexAttribPointer, "_glViewport": _glViewport, "_glfwCreateWindow": _glfwCreateWindow, "_glfwDefaultWindowHints": _glfwDefaultWindowHints, "_glfwDestroyWindow": _glfwDestroyWindow, "_glfwGetCursorPos": _glfwGetCursorPos, "_glfwGetKey": _glfwGetKey, "_glfwGetPrimaryMonitor": _glfwGetPrimaryMonitor, "_glfwGetTime": _glfwGetTime, "_glfwGetVideoModes": _glfwGetVideoModes, "_glfwInit": _glfwInit, "_glfwMakeContextCurrent": _glfwMakeContextCurrent, "_glfwSetCharCallback": _glfwSetCharCallback, "_glfwSetCursorEnterCallback": _glfwSetCursorEnterCallback, "_glfwSetCursorPosCallback": _glfwSetCursorPosCallback, "_glfwSetDropCallback": _glfwSetDropCallback, "_glfwSetErrorCallback": _glfwSetErrorCallback, "_glfwSetKeyCallback": _glfwSetKeyCallback, "_glfwSetMouseButtonCallback": _glfwSetMouseButtonCallback, "_glfwSetScrollCallback": _glfwSetScrollCallback, "_glfwSetWindowIconifyCallback": _glfwSetWindowIconifyCallback, "_glfwSetWindowShouldClose": _glfwSetWindowShouldClose, "_glfwSetWindowSizeCallback": _glfwSetWindowSizeCallback, "_glfwSwapBuffers": _glfwSwapBuffers, "_glfwSwapInterval": _glfwSwapInterval, "_glfwTerminate": _glfwTerminate, "_glfwWindowHint": _glfwWindowHint, "_llvm_exp2_f32": _llvm_exp2_f32, "_llvm_stackrestore": _llvm_stackrestore, "_llvm_stacksave": _llvm_stacksave, "_pthread_attr_destroy": _pthread_attr_destroy, "_pthread_attr_init": _pthread_attr_init, "_pthread_cond_destroy": _pthread_cond_destroy, "_pthread_cond_init": _pthread_cond_init, "_pthread_cond_signal": _pthread_cond_signal, "_pthread_cond_wait": _pthread_cond_wait, "_pthread_create": _pthread_create, "_pthread_join": _pthread_join, "_pthread_mutex_destroy": _pthread_mutex_destroy, "_pthread_mutex_init": _pthread_mutex_init, "_time": _time, "_usleep": _usleep, "emscriptenWebGLComputeImageSize": emscriptenWebGLComputeImageSize, "emscriptenWebGLGet": emscriptenWebGLGet, "emscriptenWebGLGetTexPixelData": emscriptenWebGLGetTexPixelData, "emscriptenWebGLGetUniform": emscriptenWebGLGetUniform, "emscriptenWebGLGetVertexAttrib": emscriptenWebGLGetVertexAttrib, "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "tempDoublePtr": tempDoublePtr, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX };
// EMSCRIPTEN_START_ASM
var asm =Module["asm"]// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);

Module["asm"] = asm;
var ___errno_location = Module["___errno_location"] = function() {  return Module["asm"]["___errno_location"].apply(null, arguments) };
var _emscripten_GetProcAddress = Module["_emscripten_GetProcAddress"] = function() {  return Module["asm"]["_emscripten_GetProcAddress"].apply(null, arguments) };
var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = function() {  return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments) };
var _free = Module["_free"] = function() {  return Module["asm"]["_free"].apply(null, arguments) };
var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = function() {  return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments) };
var _llvm_round_f32 = Module["_llvm_round_f32"] = function() {  return Module["asm"]["_llvm_round_f32"].apply(null, arguments) };
var _main = Module["_main"] = function() {  return Module["asm"]["_main"].apply(null, arguments) };
var _malloc = Module["_malloc"] = function() {  return Module["asm"]["_malloc"].apply(null, arguments) };
var _memcpy = Module["_memcpy"] = function() {  return Module["asm"]["_memcpy"].apply(null, arguments) };
var _memmove = Module["_memmove"] = function() {  return Module["asm"]["_memmove"].apply(null, arguments) };
var _memset = Module["_memset"] = function() {  return Module["asm"]["_memset"].apply(null, arguments) };
var _pthread_mutex_lock = Module["_pthread_mutex_lock"] = function() {  return Module["asm"]["_pthread_mutex_lock"].apply(null, arguments) };
var _pthread_mutex_unlock = Module["_pthread_mutex_unlock"] = function() {  return Module["asm"]["_pthread_mutex_unlock"].apply(null, arguments) };
var _sbrk = Module["_sbrk"] = function() {  return Module["asm"]["_sbrk"].apply(null, arguments) };
var _strstr = Module["_strstr"] = function() {  return Module["asm"]["_strstr"].apply(null, arguments) };
var establishStackSpace = Module["establishStackSpace"] = function() {  return Module["asm"]["establishStackSpace"].apply(null, arguments) };
var setThrew = Module["setThrew"] = function() {  return Module["asm"]["setThrew"].apply(null, arguments) };
var stackAlloc = Module["stackAlloc"] = function() {  return Module["asm"]["stackAlloc"].apply(null, arguments) };
var stackRestore = Module["stackRestore"] = function() {  return Module["asm"]["stackRestore"].apply(null, arguments) };
var stackSave = Module["stackSave"] = function() {  return Module["asm"]["stackSave"].apply(null, arguments) };
var dynCall_ff = Module["dynCall_ff"] = function() {  return Module["asm"]["dynCall_ff"].apply(null, arguments) };
var dynCall_fff = Module["dynCall_fff"] = function() {  return Module["asm"]["dynCall_fff"].apply(null, arguments) };
var dynCall_i = Module["dynCall_i"] = function() {  return Module["asm"]["dynCall_i"].apply(null, arguments) };
var dynCall_ii = Module["dynCall_ii"] = function() {  return Module["asm"]["dynCall_ii"].apply(null, arguments) };
var dynCall_iii = Module["dynCall_iii"] = function() {  return Module["asm"]["dynCall_iii"].apply(null, arguments) };
var dynCall_iiii = Module["dynCall_iiii"] = function() {  return Module["asm"]["dynCall_iiii"].apply(null, arguments) };
var dynCall_iiiii = Module["dynCall_iiiii"] = function() {  return Module["asm"]["dynCall_iiiii"].apply(null, arguments) };
var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {  return Module["asm"]["dynCall_iiiiii"].apply(null, arguments) };
var dynCall_jijii = Module["dynCall_jijii"] = function() {  return Module["asm"]["dynCall_jijii"].apply(null, arguments) };
var dynCall_v = Module["dynCall_v"] = function() {  return Module["asm"]["dynCall_v"].apply(null, arguments) };
var dynCall_vd = Module["dynCall_vd"] = function() {  return Module["asm"]["dynCall_vd"].apply(null, arguments) };
var dynCall_vdd = Module["dynCall_vdd"] = function() {  return Module["asm"]["dynCall_vdd"].apply(null, arguments) };
var dynCall_vddd = Module["dynCall_vddd"] = function() {  return Module["asm"]["dynCall_vddd"].apply(null, arguments) };
var dynCall_vdddd = Module["dynCall_vdddd"] = function() {  return Module["asm"]["dynCall_vdddd"].apply(null, arguments) };
var dynCall_vdddddd = Module["dynCall_vdddddd"] = function() {  return Module["asm"]["dynCall_vdddddd"].apply(null, arguments) };
var dynCall_vf = Module["dynCall_vf"] = function() {  return Module["asm"]["dynCall_vf"].apply(null, arguments) };
var dynCall_vff = Module["dynCall_vff"] = function() {  return Module["asm"]["dynCall_vff"].apply(null, arguments) };
var dynCall_vfff = Module["dynCall_vfff"] = function() {  return Module["asm"]["dynCall_vfff"].apply(null, arguments) };
var dynCall_vffff = Module["dynCall_vffff"] = function() {  return Module["asm"]["dynCall_vffff"].apply(null, arguments) };
var dynCall_vfi = Module["dynCall_vfi"] = function() {  return Module["asm"]["dynCall_vfi"].apply(null, arguments) };
var dynCall_vi = Module["dynCall_vi"] = function() {  return Module["asm"]["dynCall_vi"].apply(null, arguments) };
var dynCall_vid = Module["dynCall_vid"] = function() {  return Module["asm"]["dynCall_vid"].apply(null, arguments) };
var dynCall_vidd = Module["dynCall_vidd"] = function() {  return Module["asm"]["dynCall_vidd"].apply(null, arguments) };
var dynCall_viddd = Module["dynCall_viddd"] = function() {  return Module["asm"]["dynCall_viddd"].apply(null, arguments) };
var dynCall_vidddd = Module["dynCall_vidddd"] = function() {  return Module["asm"]["dynCall_vidddd"].apply(null, arguments) };
var dynCall_viddidd = Module["dynCall_viddidd"] = function() {  return Module["asm"]["dynCall_viddidd"].apply(null, arguments) };
var dynCall_viddiiddiii = Module["dynCall_viddiiddiii"] = function() {  return Module["asm"]["dynCall_viddiiddiii"].apply(null, arguments) };
var dynCall_viddiii = Module["dynCall_viddiii"] = function() {  return Module["asm"]["dynCall_viddiii"].apply(null, arguments) };
var dynCall_vif = Module["dynCall_vif"] = function() {  return Module["asm"]["dynCall_vif"].apply(null, arguments) };
var dynCall_viff = Module["dynCall_viff"] = function() {  return Module["asm"]["dynCall_viff"].apply(null, arguments) };
var dynCall_vifff = Module["dynCall_vifff"] = function() {  return Module["asm"]["dynCall_vifff"].apply(null, arguments) };
var dynCall_viffff = Module["dynCall_viffff"] = function() {  return Module["asm"]["dynCall_viffff"].apply(null, arguments) };
var dynCall_viffiff = Module["dynCall_viffiff"] = function() {  return Module["asm"]["dynCall_viffiff"].apply(null, arguments) };
var dynCall_viffiiffiii = Module["dynCall_viffiiffiii"] = function() {  return Module["asm"]["dynCall_viffiiffiii"].apply(null, arguments) };
var dynCall_viffiii = Module["dynCall_viffiii"] = function() {  return Module["asm"]["dynCall_viffiii"].apply(null, arguments) };
var dynCall_vii = Module["dynCall_vii"] = function() {  return Module["asm"]["dynCall_vii"].apply(null, arguments) };
var dynCall_viid = Module["dynCall_viid"] = function() {  return Module["asm"]["dynCall_viid"].apply(null, arguments) };
var dynCall_viidddd = Module["dynCall_viidddd"] = function() {  return Module["asm"]["dynCall_viidddd"].apply(null, arguments) };
var dynCall_viif = Module["dynCall_viif"] = function() {  return Module["asm"]["dynCall_viif"].apply(null, arguments) };
var dynCall_viiffff = Module["dynCall_viiffff"] = function() {  return Module["asm"]["dynCall_viiffff"].apply(null, arguments) };
var dynCall_viiffffi = Module["dynCall_viiffffi"] = function() {  return Module["asm"]["dynCall_viiffffi"].apply(null, arguments) };
var dynCall_viifi = Module["dynCall_viifi"] = function() {  return Module["asm"]["dynCall_viifi"].apply(null, arguments) };
var dynCall_viii = Module["dynCall_viii"] = function() {  return Module["asm"]["dynCall_viii"].apply(null, arguments) };
var dynCall_viiii = Module["dynCall_viiii"] = function() {  return Module["asm"]["dynCall_viiii"].apply(null, arguments) };
var dynCall_viiiii = Module["dynCall_viiiii"] = function() {  return Module["asm"]["dynCall_viiiii"].apply(null, arguments) };
var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {  return Module["asm"]["dynCall_viiiiii"].apply(null, arguments) };
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiiii"].apply(null, arguments) };
var dynCall_viiji = Module["dynCall_viiji"] = function() {  return Module["asm"]["dynCall_viiji"].apply(null, arguments) };
;



// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;








Module["getMemory"] = getMemory;
























Module["addRunDependency"] = addRunDependency;
Module["removeRunDependency"] = removeRunDependency;


Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;































/**
 * @constructor
 * @extends {Error}
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = function callMain(args) {

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  var argv = stackAlloc((argc + 1) * 4);
  HEAP32[argv >> 2] = allocateUTF8OnStack(Module['thisProgram']);
  for (var i = 1; i < argc; i++) {
    HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1]);
  }
  HEAP32[(argv >> 2) + argc] = 0;


  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
      exit(ret, /* implicit = */ true);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      var toLog = e;
      if (e && typeof e === 'object' && e.stack) {
        toLog = [e, e.stack];
      }
      err('exception thrown: ' + toLog);
      Module['quit'](1, e);
    }
  } finally {
    calledMain = true;
  }
}




/** @type {function(Array=)} */
function run(args) {
  args = args || Module['arguments'];

  if (runDependencies > 0) {
    return;
  }


  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return;

    ensureInitRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = run;


function exit(status, implicit) {

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && Module['noExitRuntime'] && status === 0) {
    return;
  }

  if (Module['noExitRuntime']) {
  } else {

    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  Module['quit'](status, new ExitStatus(status));
}

var abortDecorators = [];

function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  if (what !== undefined) {
    out(what);
    err(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';
}
Module['abort'] = abort;

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

  Module["noExitRuntime"] = true;

run();





// {{MODULE_ADDITIONS}}



