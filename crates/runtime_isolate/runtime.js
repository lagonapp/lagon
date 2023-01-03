var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/web-streams-polyfill@3.2.1/node_modules/web-streams-polyfill/dist/polyfill.min.js
var require_polyfill_min = __commonJS({
  "../../node_modules/.pnpm/web-streams-polyfill@3.2.1/node_modules/web-streams-polyfill/dist/polyfill.min.js"(exports, module) {
    !function(e, r) {
      "object" == typeof exports && "undefined" != typeof module ? r(exports) : "function" == typeof define && define.amd ? define(["exports"], r) : r((e = "undefined" != typeof globalThis ? globalThis : e || self).WebStreamsPolyfill = {});
    }(exports, function(e) {
      "use strict";
      var r = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? Symbol : function(e2) {
        return "Symbol(" + e2 + ")";
      };
      function t() {
      }
      var o = "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof global ? global : void 0;
      function n(e2) {
        return "object" == typeof e2 && null !== e2 || "function" == typeof e2;
      }
      var a = t, i = Promise, l = Promise.prototype.then, u = Promise.resolve.bind(i), s = Promise.reject.bind(i);
      function c(e2) {
        return new i(e2);
      }
      function d(e2) {
        return u(e2);
      }
      function f(e2) {
        return s(e2);
      }
      function b(e2, r2, t2) {
        return l.call(e2, r2, t2);
      }
      function p(e2, r2, t2) {
        b(b(e2, r2, t2), void 0, a);
      }
      function _(e2, r2) {
        p(e2, r2);
      }
      function h(e2, r2) {
        p(e2, void 0, r2);
      }
      function m(e2, r2, t2) {
        return b(e2, r2, t2);
      }
      function y(e2) {
        b(e2, void 0, a);
      }
      var v = function() {
        var e2 = o && o.queueMicrotask;
        if ("function" == typeof e2)
          return e2;
        var r2 = d(void 0);
        return function(e3) {
          return b(r2, e3);
        };
      }();
      function g(e2, r2, t2) {
        if ("function" != typeof e2)
          throw new TypeError("Argument is not a function");
        return Function.prototype.apply.call(e2, r2, t2);
      }
      function S(e2, r2, t2) {
        try {
          return d(g(e2, r2, t2));
        } catch (e3) {
          return f(e3);
        }
      }
      var w = function() {
        function e2() {
          this._cursor = 0, this._size = 0, this._front = { _elements: [], _next: void 0 }, this._back = this._front, this._cursor = 0, this._size = 0;
        }
        return Object.defineProperty(e2.prototype, "length", { get: function() {
          return this._size;
        }, enumerable: false, configurable: true }), e2.prototype.push = function(e3) {
          var r2 = this._back, t2 = r2;
          16383 === r2._elements.length && (t2 = { _elements: [], _next: void 0 }), r2._elements.push(e3), t2 !== r2 && (this._back = t2, r2._next = t2), ++this._size;
        }, e2.prototype.shift = function() {
          var e3 = this._front, r2 = e3, t2 = this._cursor, o2 = t2 + 1, n2 = e3._elements, a2 = n2[t2];
          return 16384 === o2 && (r2 = e3._next, o2 = 0), --this._size, this._cursor = o2, e3 !== r2 && (this._front = r2), n2[t2] = void 0, a2;
        }, e2.prototype.forEach = function(e3) {
          for (var r2 = this._cursor, t2 = this._front, o2 = t2._elements; !(r2 === o2.length && void 0 === t2._next || r2 === o2.length && (r2 = 0, 0 === (o2 = (t2 = t2._next)._elements).length)); )
            e3(o2[r2]), ++r2;
        }, e2.prototype.peek = function() {
          var e3 = this._front, r2 = this._cursor;
          return e3._elements[r2];
        }, e2;
      }();
      function R(e2, r2) {
        e2._ownerReadableStream = r2, r2._reader = e2, "readable" === r2._state ? q(e2) : "closed" === r2._state ? function(e3) {
          q(e3), W(e3);
        }(e2) : O(e2, r2._storedError);
      }
      function T(e2, r2) {
        return Tt(e2._ownerReadableStream, r2);
      }
      function C(e2) {
        "readable" === e2._ownerReadableStream._state ? E(e2, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")) : function(e3, r2) {
          O(e3, r2);
        }(e2, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")), e2._ownerReadableStream._reader = void 0, e2._ownerReadableStream = void 0;
      }
      function P(e2) {
        return new TypeError("Cannot " + e2 + " a stream using a released reader");
      }
      function q(e2) {
        e2._closedPromise = c(function(r2, t2) {
          e2._closedPromise_resolve = r2, e2._closedPromise_reject = t2;
        });
      }
      function O(e2, r2) {
        q(e2), E(e2, r2);
      }
      function E(e2, r2) {
        void 0 !== e2._closedPromise_reject && (y(e2._closedPromise), e2._closedPromise_reject(r2), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0);
      }
      function W(e2) {
        void 0 !== e2._closedPromise_resolve && (e2._closedPromise_resolve(void 0), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0);
      }
      var j = r("[[AbortSteps]]"), B = r("[[ErrorSteps]]"), k = r("[[CancelSteps]]"), A = r("[[PullSteps]]"), z = Number.isFinite || function(e2) {
        return "number" == typeof e2 && isFinite(e2);
      }, D = Math.trunc || function(e2) {
        return e2 < 0 ? Math.ceil(e2) : Math.floor(e2);
      };
      function I(e2, r2) {
        if (void 0 !== e2 && ("object" != typeof (t2 = e2) && "function" != typeof t2))
          throw new TypeError(r2 + " is not an object.");
        var t2;
      }
      function F(e2, r2) {
        if ("function" != typeof e2)
          throw new TypeError(r2 + " is not a function.");
      }
      function L(e2, r2) {
        if (!function(e3) {
          return "object" == typeof e3 && null !== e3 || "function" == typeof e3;
        }(e2))
          throw new TypeError(r2 + " is not an object.");
      }
      function M(e2, r2, t2) {
        if (void 0 === e2)
          throw new TypeError("Parameter " + r2 + " is required in '" + t2 + "'.");
      }
      function Q(e2, r2, t2) {
        if (void 0 === e2)
          throw new TypeError(r2 + " is required in '" + t2 + "'.");
      }
      function Y(e2) {
        return Number(e2);
      }
      function x(e2) {
        return 0 === e2 ? 0 : e2;
      }
      function N(e2, r2) {
        var t2 = Number.MAX_SAFE_INTEGER, o2 = Number(e2);
        if (o2 = x(o2), !z(o2))
          throw new TypeError(r2 + " is not a finite number");
        if ((o2 = function(e3) {
          return x(D(e3));
        }(o2)) < 0 || o2 > t2)
          throw new TypeError(r2 + " is outside the accepted range of 0 to " + t2 + ", inclusive");
        return z(o2) && 0 !== o2 ? o2 : 0;
      }
      function H(e2, r2) {
        if (!wt(e2))
          throw new TypeError(r2 + " is not a ReadableStream.");
      }
      function V(e2) {
        return new $(e2);
      }
      function U(e2, r2) {
        e2._reader._readRequests.push(r2);
      }
      function G(e2, r2, t2) {
        var o2 = e2._reader._readRequests.shift();
        t2 ? o2._closeSteps() : o2._chunkSteps(r2);
      }
      function X(e2) {
        return e2._reader._readRequests.length;
      }
      function J(e2) {
        var r2 = e2._reader;
        return void 0 !== r2 && !!ee(r2);
      }
      var K, Z, $ = function() {
        function ReadableStreamDefaultReader2(e2) {
          if (M(e2, 1, "ReadableStreamDefaultReader"), H(e2, "First parameter"), Rt(e2))
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          R(this, e2), this._readRequests = new w();
        }
        return Object.defineProperty(ReadableStreamDefaultReader2.prototype, "closed", { get: function() {
          return ee(this) ? this._closedPromise : f(te("closed"));
        }, enumerable: false, configurable: true }), ReadableStreamDefaultReader2.prototype.cancel = function(e2) {
          return void 0 === e2 && (e2 = void 0), ee(this) ? void 0 === this._ownerReadableStream ? f(P("cancel")) : T(this, e2) : f(te("cancel"));
        }, ReadableStreamDefaultReader2.prototype.read = function() {
          if (!ee(this))
            return f(te("read"));
          if (void 0 === this._ownerReadableStream)
            return f(P("read from"));
          var e2, r2, t2 = c(function(t3, o2) {
            e2 = t3, r2 = o2;
          });
          return re(this, { _chunkSteps: function(r3) {
            return e2({ value: r3, done: false });
          }, _closeSteps: function() {
            return e2({ value: void 0, done: true });
          }, _errorSteps: function(e3) {
            return r2(e3);
          } }), t2;
        }, ReadableStreamDefaultReader2.prototype.releaseLock = function() {
          if (!ee(this))
            throw te("releaseLock");
          if (void 0 !== this._ownerReadableStream) {
            if (this._readRequests.length > 0)
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            C(this);
          }
        }, ReadableStreamDefaultReader2;
      }();
      function ee(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_readRequests") && e2 instanceof $);
      }
      function re(e2, r2) {
        var t2 = e2._ownerReadableStream;
        t2._disturbed = true, "closed" === t2._state ? r2._closeSteps() : "errored" === t2._state ? r2._errorSteps(t2._storedError) : t2._readableStreamController[A](r2);
      }
      function te(e2) {
        return new TypeError("ReadableStreamDefaultReader.prototype." + e2 + " can only be used on a ReadableStreamDefaultReader");
      }
      Object.defineProperties($.prototype, { cancel: { enumerable: true }, read: { enumerable: true }, releaseLock: { enumerable: true }, closed: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty($.prototype, r.toStringTag, { value: "ReadableStreamDefaultReader", configurable: true }), "symbol" == typeof r.asyncIterator && ((K = {})[r.asyncIterator] = function() {
        return this;
      }, Z = K, Object.defineProperty(Z, r.asyncIterator, { enumerable: false }));
      var oe = function() {
        function e2(e3, r2) {
          this._ongoingPromise = void 0, this._isFinished = false, this._reader = e3, this._preventCancel = r2;
        }
        return e2.prototype.next = function() {
          var e3 = this, r2 = function() {
            return e3._nextSteps();
          };
          return this._ongoingPromise = this._ongoingPromise ? m(this._ongoingPromise, r2, r2) : r2(), this._ongoingPromise;
        }, e2.prototype.return = function(e3) {
          var r2 = this, t2 = function() {
            return r2._returnSteps(e3);
          };
          return this._ongoingPromise ? m(this._ongoingPromise, t2, t2) : t2();
        }, e2.prototype._nextSteps = function() {
          var e3 = this;
          if (this._isFinished)
            return Promise.resolve({ value: void 0, done: true });
          var r2, t2, o2 = this._reader;
          if (void 0 === o2._ownerReadableStream)
            return f(P("iterate"));
          var n2 = c(function(e4, o3) {
            r2 = e4, t2 = o3;
          });
          return re(o2, { _chunkSteps: function(t3) {
            e3._ongoingPromise = void 0, v(function() {
              return r2({ value: t3, done: false });
            });
          }, _closeSteps: function() {
            e3._ongoingPromise = void 0, e3._isFinished = true, C(o2), r2({ value: void 0, done: true });
          }, _errorSteps: function(r3) {
            e3._ongoingPromise = void 0, e3._isFinished = true, C(o2), t2(r3);
          } }), n2;
        }, e2.prototype._returnSteps = function(e3) {
          if (this._isFinished)
            return Promise.resolve({ value: e3, done: true });
          this._isFinished = true;
          var r2 = this._reader;
          if (void 0 === r2._ownerReadableStream)
            return f(P("finish iterating"));
          if (!this._preventCancel) {
            var t2 = T(r2, e3);
            return C(r2), m(t2, function() {
              return { value: e3, done: true };
            });
          }
          return C(r2), d({ value: e3, done: true });
        }, e2;
      }(), ne = { next: function() {
        return ae(this) ? this._asyncIteratorImpl.next() : f(ie("next"));
      }, return: function(e2) {
        return ae(this) ? this._asyncIteratorImpl.return(e2) : f(ie("return"));
      } };
      function ae(e2) {
        if (!n(e2))
          return false;
        if (!Object.prototype.hasOwnProperty.call(e2, "_asyncIteratorImpl"))
          return false;
        try {
          return e2._asyncIteratorImpl instanceof oe;
        } catch (e3) {
          return false;
        }
      }
      function ie(e2) {
        return new TypeError("ReadableStreamAsyncIterator." + e2 + " can only be used on a ReadableSteamAsyncIterator");
      }
      void 0 !== Z && Object.setPrototypeOf(ne, Z);
      var le = Number.isNaN || function(e2) {
        return e2 != e2;
      };
      function ue(e2) {
        return e2.slice();
      }
      function se(e2, r2, t2, o2, n2) {
        new Uint8Array(e2).set(new Uint8Array(t2, o2, n2), r2);
      }
      function ce(e2, r2, t2) {
        if (e2.slice)
          return e2.slice(r2, t2);
        var o2 = t2 - r2, n2 = new ArrayBuffer(o2);
        return se(n2, 0, e2, r2, o2), n2;
      }
      function de(e2) {
        var r2 = ce(e2.buffer, e2.byteOffset, e2.byteOffset + e2.byteLength);
        return new Uint8Array(r2);
      }
      function fe(e2) {
        var r2 = e2._queue.shift();
        return e2._queueTotalSize -= r2.size, e2._queueTotalSize < 0 && (e2._queueTotalSize = 0), r2.value;
      }
      function be(e2, r2, t2) {
        if ("number" != typeof (o2 = t2) || le(o2) || o2 < 0 || t2 === 1 / 0)
          throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
        var o2;
        e2._queue.push({ value: r2, size: t2 }), e2._queueTotalSize += t2;
      }
      function pe(e2) {
        e2._queue = new w(), e2._queueTotalSize = 0;
      }
      var _e = function() {
        function ReadableStreamBYOBRequest() {
          throw new TypeError("Illegal constructor");
        }
        return Object.defineProperty(ReadableStreamBYOBRequest.prototype, "view", { get: function() {
          if (!ye(this))
            throw Me("view");
          return this._view;
        }, enumerable: false, configurable: true }), ReadableStreamBYOBRequest.prototype.respond = function(e2) {
          if (!ye(this))
            throw Me("respond");
          if (M(e2, 1, "respond"), e2 = N(e2, "First parameter"), void 0 === this._associatedReadableByteStreamController)
            throw new TypeError("This BYOB request has been invalidated");
          this._view.buffer, Ie(this._associatedReadableByteStreamController, e2);
        }, ReadableStreamBYOBRequest.prototype.respondWithNewView = function(e2) {
          if (!ye(this))
            throw Me("respondWithNewView");
          if (M(e2, 1, "respondWithNewView"), !ArrayBuffer.isView(e2))
            throw new TypeError("You can only respond with array buffer views");
          if (void 0 === this._associatedReadableByteStreamController)
            throw new TypeError("This BYOB request has been invalidated");
          e2.buffer, Fe(this._associatedReadableByteStreamController, e2);
        }, ReadableStreamBYOBRequest;
      }();
      Object.defineProperties(_e.prototype, { respond: { enumerable: true }, respondWithNewView: { enumerable: true }, view: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(_e.prototype, r.toStringTag, { value: "ReadableStreamBYOBRequest", configurable: true });
      var he = function() {
        function ReadableByteStreamController() {
          throw new TypeError("Illegal constructor");
        }
        return Object.defineProperty(ReadableByteStreamController.prototype, "byobRequest", { get: function() {
          if (!me(this))
            throw Qe("byobRequest");
          return ze(this);
        }, enumerable: false, configurable: true }), Object.defineProperty(ReadableByteStreamController.prototype, "desiredSize", { get: function() {
          if (!me(this))
            throw Qe("desiredSize");
          return De(this);
        }, enumerable: false, configurable: true }), ReadableByteStreamController.prototype.close = function() {
          if (!me(this))
            throw Qe("close");
          if (this._closeRequested)
            throw new TypeError("The stream has already been closed; do not close it again!");
          var e2 = this._controlledReadableByteStream._state;
          if ("readable" !== e2)
            throw new TypeError("The stream (in " + e2 + " state) is not in the readable state and cannot be closed");
          Be(this);
        }, ReadableByteStreamController.prototype.enqueue = function(e2) {
          if (!me(this))
            throw Qe("enqueue");
          if (M(e2, 1, "enqueue"), !ArrayBuffer.isView(e2))
            throw new TypeError("chunk must be an array buffer view");
          if (0 === e2.byteLength)
            throw new TypeError("chunk must have non-zero byteLength");
          if (0 === e2.buffer.byteLength)
            throw new TypeError("chunk's buffer must have non-zero byteLength");
          if (this._closeRequested)
            throw new TypeError("stream is closed or draining");
          var r2 = this._controlledReadableByteStream._state;
          if ("readable" !== r2)
            throw new TypeError("The stream (in " + r2 + " state) is not in the readable state and cannot be enqueued to");
          ke(this, e2);
        }, ReadableByteStreamController.prototype.error = function(e2) {
          if (void 0 === e2 && (e2 = void 0), !me(this))
            throw Qe("error");
          Ae(this, e2);
        }, ReadableByteStreamController.prototype[k] = function(e2) {
          ge(this), pe(this);
          var r2 = this._cancelAlgorithm(e2);
          return je(this), r2;
        }, ReadableByteStreamController.prototype[A] = function(e2) {
          var r2 = this._controlledReadableByteStream;
          if (this._queueTotalSize > 0) {
            var t2 = this._queue.shift();
            this._queueTotalSize -= t2.byteLength, Pe(this);
            var o2 = new Uint8Array(t2.buffer, t2.byteOffset, t2.byteLength);
            e2._chunkSteps(o2);
          } else {
            var n2 = this._autoAllocateChunkSize;
            if (void 0 !== n2) {
              var a2 = void 0;
              try {
                a2 = new ArrayBuffer(n2);
              } catch (r3) {
                return void e2._errorSteps(r3);
              }
              var i2 = { buffer: a2, bufferByteLength: n2, byteOffset: 0, byteLength: n2, bytesFilled: 0, elementSize: 1, viewConstructor: Uint8Array, readerType: "default" };
              this._pendingPullIntos.push(i2);
            }
            U(r2, e2), ve(this);
          }
        }, ReadableByteStreamController;
      }();
      function me(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_controlledReadableByteStream") && e2 instanceof he);
      }
      function ye(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_associatedReadableByteStreamController") && e2 instanceof _e);
      }
      function ve(e2) {
        (function(e3) {
          var r2 = e3._controlledReadableByteStream;
          if ("readable" !== r2._state)
            return false;
          if (e3._closeRequested)
            return false;
          if (!e3._started)
            return false;
          if (J(r2) && X(r2) > 0)
            return true;
          if (He(r2) && Ne(r2) > 0)
            return true;
          if (De(e3) > 0)
            return true;
          return false;
        })(e2) && (e2._pulling ? e2._pullAgain = true : (e2._pulling = true, p(e2._pullAlgorithm(), function() {
          e2._pulling = false, e2._pullAgain && (e2._pullAgain = false, ve(e2));
        }, function(r2) {
          Ae(e2, r2);
        })));
      }
      function ge(e2) {
        qe(e2), e2._pendingPullIntos = new w();
      }
      function Se(e2, r2) {
        var t2 = false;
        "closed" === e2._state && (t2 = true);
        var o2 = we(r2);
        "default" === r2.readerType ? G(e2, o2, t2) : function(e3, r3, t3) {
          var o3 = e3._reader._readIntoRequests.shift();
          t3 ? o3._closeSteps(r3) : o3._chunkSteps(r3);
        }(e2, o2, t2);
      }
      function we(e2) {
        var r2 = e2.bytesFilled, t2 = e2.elementSize;
        return new e2.viewConstructor(e2.buffer, e2.byteOffset, r2 / t2);
      }
      function Re(e2, r2, t2, o2) {
        e2._queue.push({ buffer: r2, byteOffset: t2, byteLength: o2 }), e2._queueTotalSize += o2;
      }
      function Te(e2, r2) {
        var t2 = r2.elementSize, o2 = r2.bytesFilled - r2.bytesFilled % t2, n2 = Math.min(e2._queueTotalSize, r2.byteLength - r2.bytesFilled), a2 = r2.bytesFilled + n2, i2 = a2 - a2 % t2, l2 = n2, u2 = false;
        i2 > o2 && (l2 = i2 - r2.bytesFilled, u2 = true);
        for (var s2 = e2._queue; l2 > 0; ) {
          var c2 = s2.peek(), d2 = Math.min(l2, c2.byteLength), f2 = r2.byteOffset + r2.bytesFilled;
          se(r2.buffer, f2, c2.buffer, c2.byteOffset, d2), c2.byteLength === d2 ? s2.shift() : (c2.byteOffset += d2, c2.byteLength -= d2), e2._queueTotalSize -= d2, Ce(e2, d2, r2), l2 -= d2;
        }
        return u2;
      }
      function Ce(e2, r2, t2) {
        t2.bytesFilled += r2;
      }
      function Pe(e2) {
        0 === e2._queueTotalSize && e2._closeRequested ? (je(e2), Ct(e2._controlledReadableByteStream)) : ve(e2);
      }
      function qe(e2) {
        null !== e2._byobRequest && (e2._byobRequest._associatedReadableByteStreamController = void 0, e2._byobRequest._view = null, e2._byobRequest = null);
      }
      function Oe(e2) {
        for (; e2._pendingPullIntos.length > 0; ) {
          if (0 === e2._queueTotalSize)
            return;
          var r2 = e2._pendingPullIntos.peek();
          Te(e2, r2) && (We(e2), Se(e2._controlledReadableByteStream, r2));
        }
      }
      function Ee(e2, r2) {
        var t2 = e2._pendingPullIntos.peek();
        qe(e2), "closed" === e2._controlledReadableByteStream._state ? function(e3, r3) {
          var t3 = e3._controlledReadableByteStream;
          if (He(t3))
            for (; Ne(t3) > 0; )
              Se(t3, We(e3));
        }(e2) : function(e3, r3, t3) {
          if (Ce(0, r3, t3), !(t3.bytesFilled < t3.elementSize)) {
            We(e3);
            var o2 = t3.bytesFilled % t3.elementSize;
            if (o2 > 0) {
              var n2 = t3.byteOffset + t3.bytesFilled, a2 = ce(t3.buffer, n2 - o2, n2);
              Re(e3, a2, 0, a2.byteLength);
            }
            t3.bytesFilled -= o2, Se(e3._controlledReadableByteStream, t3), Oe(e3);
          }
        }(e2, r2, t2), ve(e2);
      }
      function We(e2) {
        return e2._pendingPullIntos.shift();
      }
      function je(e2) {
        e2._pullAlgorithm = void 0, e2._cancelAlgorithm = void 0;
      }
      function Be(e2) {
        var r2 = e2._controlledReadableByteStream;
        if (!e2._closeRequested && "readable" === r2._state)
          if (e2._queueTotalSize > 0)
            e2._closeRequested = true;
          else {
            if (e2._pendingPullIntos.length > 0) {
              if (e2._pendingPullIntos.peek().bytesFilled > 0) {
                var t2 = new TypeError("Insufficient bytes to fill elements in the given buffer");
                throw Ae(e2, t2), t2;
              }
            }
            je(e2), Ct(r2);
          }
      }
      function ke(e2, r2) {
        var t2 = e2._controlledReadableByteStream;
        if (!e2._closeRequested && "readable" === t2._state) {
          var o2 = r2.buffer, n2 = r2.byteOffset, a2 = r2.byteLength, i2 = o2;
          if (e2._pendingPullIntos.length > 0) {
            var l2 = e2._pendingPullIntos.peek();
            l2.buffer, 0, l2.buffer = l2.buffer;
          }
          if (qe(e2), J(t2))
            if (0 === X(t2))
              Re(e2, i2, n2, a2);
            else
              e2._pendingPullIntos.length > 0 && We(e2), G(t2, new Uint8Array(i2, n2, a2), false);
          else
            He(t2) ? (Re(e2, i2, n2, a2), Oe(e2)) : Re(e2, i2, n2, a2);
          ve(e2);
        }
      }
      function Ae(e2, r2) {
        var t2 = e2._controlledReadableByteStream;
        "readable" === t2._state && (ge(e2), pe(e2), je(e2), Pt(t2, r2));
      }
      function ze(e2) {
        if (null === e2._byobRequest && e2._pendingPullIntos.length > 0) {
          var r2 = e2._pendingPullIntos.peek(), t2 = new Uint8Array(r2.buffer, r2.byteOffset + r2.bytesFilled, r2.byteLength - r2.bytesFilled), o2 = Object.create(_e.prototype);
          !function(e3, r3, t3) {
            e3._associatedReadableByteStreamController = r3, e3._view = t3;
          }(o2, e2, t2), e2._byobRequest = o2;
        }
        return e2._byobRequest;
      }
      function De(e2) {
        var r2 = e2._controlledReadableByteStream._state;
        return "errored" === r2 ? null : "closed" === r2 ? 0 : e2._strategyHWM - e2._queueTotalSize;
      }
      function Ie(e2, r2) {
        var t2 = e2._pendingPullIntos.peek();
        if ("closed" === e2._controlledReadableByteStream._state) {
          if (0 !== r2)
            throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
        } else {
          if (0 === r2)
            throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
          if (t2.bytesFilled + r2 > t2.byteLength)
            throw new RangeError("bytesWritten out of range");
        }
        t2.buffer = t2.buffer, Ee(e2, r2);
      }
      function Fe(e2, r2) {
        var t2 = e2._pendingPullIntos.peek();
        if ("closed" === e2._controlledReadableByteStream._state) {
          if (0 !== r2.byteLength)
            throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
        } else if (0 === r2.byteLength)
          throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
        if (t2.byteOffset + t2.bytesFilled !== r2.byteOffset)
          throw new RangeError("The region specified by view does not match byobRequest");
        if (t2.bufferByteLength !== r2.buffer.byteLength)
          throw new RangeError("The buffer of view has different capacity than byobRequest");
        if (t2.bytesFilled + r2.byteLength > t2.byteLength)
          throw new RangeError("The region specified by view is larger than byobRequest");
        var o2 = r2.byteLength;
        t2.buffer = r2.buffer, Ee(e2, o2);
      }
      function Le(e2, r2, t2, o2, n2, a2, i2) {
        r2._controlledReadableByteStream = e2, r2._pullAgain = false, r2._pulling = false, r2._byobRequest = null, r2._queue = r2._queueTotalSize = void 0, pe(r2), r2._closeRequested = false, r2._started = false, r2._strategyHWM = a2, r2._pullAlgorithm = o2, r2._cancelAlgorithm = n2, r2._autoAllocateChunkSize = i2, r2._pendingPullIntos = new w(), e2._readableStreamController = r2, p(d(t2()), function() {
          r2._started = true, ve(r2);
        }, function(e3) {
          Ae(r2, e3);
        });
      }
      function Me(e2) {
        return new TypeError("ReadableStreamBYOBRequest.prototype." + e2 + " can only be used on a ReadableStreamBYOBRequest");
      }
      function Qe(e2) {
        return new TypeError("ReadableByteStreamController.prototype." + e2 + " can only be used on a ReadableByteStreamController");
      }
      function Ye(e2) {
        return new Ve(e2);
      }
      function xe(e2, r2) {
        e2._reader._readIntoRequests.push(r2);
      }
      function Ne(e2) {
        return e2._reader._readIntoRequests.length;
      }
      function He(e2) {
        var r2 = e2._reader;
        return void 0 !== r2 && !!Ue(r2);
      }
      Object.defineProperties(he.prototype, { close: { enumerable: true }, enqueue: { enumerable: true }, error: { enumerable: true }, byobRequest: { enumerable: true }, desiredSize: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(he.prototype, r.toStringTag, { value: "ReadableByteStreamController", configurable: true });
      var Ve = function() {
        function ReadableStreamBYOBReader2(e2) {
          if (M(e2, 1, "ReadableStreamBYOBReader"), H(e2, "First parameter"), Rt(e2))
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          if (!me(e2._readableStreamController))
            throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
          R(this, e2), this._readIntoRequests = new w();
        }
        return Object.defineProperty(ReadableStreamBYOBReader2.prototype, "closed", { get: function() {
          return Ue(this) ? this._closedPromise : f(Xe("closed"));
        }, enumerable: false, configurable: true }), ReadableStreamBYOBReader2.prototype.cancel = function(e2) {
          return void 0 === e2 && (e2 = void 0), Ue(this) ? void 0 === this._ownerReadableStream ? f(P("cancel")) : T(this, e2) : f(Xe("cancel"));
        }, ReadableStreamBYOBReader2.prototype.read = function(e2) {
          if (!Ue(this))
            return f(Xe("read"));
          if (!ArrayBuffer.isView(e2))
            return f(new TypeError("view must be an array buffer view"));
          if (0 === e2.byteLength)
            return f(new TypeError("view must have non-zero byteLength"));
          if (0 === e2.buffer.byteLength)
            return f(new TypeError("view's buffer must have non-zero byteLength"));
          if (e2.buffer, void 0 === this._ownerReadableStream)
            return f(P("read from"));
          var r2, t2, o2 = c(function(e3, o3) {
            r2 = e3, t2 = o3;
          });
          return Ge(this, e2, { _chunkSteps: function(e3) {
            return r2({ value: e3, done: false });
          }, _closeSteps: function(e3) {
            return r2({ value: e3, done: true });
          }, _errorSteps: function(e3) {
            return t2(e3);
          } }), o2;
        }, ReadableStreamBYOBReader2.prototype.releaseLock = function() {
          if (!Ue(this))
            throw Xe("releaseLock");
          if (void 0 !== this._ownerReadableStream) {
            if (this._readIntoRequests.length > 0)
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            C(this);
          }
        }, ReadableStreamBYOBReader2;
      }();
      function Ue(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_readIntoRequests") && e2 instanceof Ve);
      }
      function Ge(e2, r2, t2) {
        var o2 = e2._ownerReadableStream;
        o2._disturbed = true, "errored" === o2._state ? t2._errorSteps(o2._storedError) : function(e3, r3, t3) {
          var o3 = e3._controlledReadableByteStream, n2 = 1;
          r3.constructor !== DataView && (n2 = r3.constructor.BYTES_PER_ELEMENT);
          var a2 = r3.constructor, i2 = r3.buffer, l2 = { buffer: i2, bufferByteLength: i2.byteLength, byteOffset: r3.byteOffset, byteLength: r3.byteLength, bytesFilled: 0, elementSize: n2, viewConstructor: a2, readerType: "byob" };
          if (e3._pendingPullIntos.length > 0)
            return e3._pendingPullIntos.push(l2), void xe(o3, t3);
          if ("closed" !== o3._state) {
            if (e3._queueTotalSize > 0) {
              if (Te(e3, l2)) {
                var u2 = we(l2);
                return Pe(e3), void t3._chunkSteps(u2);
              }
              if (e3._closeRequested) {
                var s2 = new TypeError("Insufficient bytes to fill elements in the given buffer");
                return Ae(e3, s2), void t3._errorSteps(s2);
              }
            }
            e3._pendingPullIntos.push(l2), xe(o3, t3), ve(e3);
          } else {
            var c2 = new a2(l2.buffer, l2.byteOffset, 0);
            t3._closeSteps(c2);
          }
        }(o2._readableStreamController, r2, t2);
      }
      function Xe(e2) {
        return new TypeError("ReadableStreamBYOBReader.prototype." + e2 + " can only be used on a ReadableStreamBYOBReader");
      }
      function Je(e2, r2) {
        var t2 = e2.highWaterMark;
        if (void 0 === t2)
          return r2;
        if (le(t2) || t2 < 0)
          throw new RangeError("Invalid highWaterMark");
        return t2;
      }
      function Ke(e2) {
        var r2 = e2.size;
        return r2 || function() {
          return 1;
        };
      }
      function Ze(e2, r2) {
        I(e2, r2);
        var t2 = null == e2 ? void 0 : e2.highWaterMark, o2 = null == e2 ? void 0 : e2.size;
        return { highWaterMark: void 0 === t2 ? void 0 : Y(t2), size: void 0 === o2 ? void 0 : $e(o2, r2 + " has member 'size' that") };
      }
      function $e(e2, r2) {
        return F(e2, r2), function(r3) {
          return Y(e2(r3));
        };
      }
      function er(e2, r2, t2) {
        return F(e2, t2), function(t3) {
          return S(e2, r2, [t3]);
        };
      }
      function rr(e2, r2, t2) {
        return F(e2, t2), function() {
          return S(e2, r2, []);
        };
      }
      function tr(e2, r2, t2) {
        return F(e2, t2), function(t3) {
          return g(e2, r2, [t3]);
        };
      }
      function or(e2, r2, t2) {
        return F(e2, t2), function(t3, o2) {
          return S(e2, r2, [t3, o2]);
        };
      }
      function nr(e2, r2) {
        if (!sr(e2))
          throw new TypeError(r2 + " is not a WritableStream.");
      }
      Object.defineProperties(Ve.prototype, { cancel: { enumerable: true }, read: { enumerable: true }, releaseLock: { enumerable: true }, closed: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(Ve.prototype, r.toStringTag, { value: "ReadableStreamBYOBReader", configurable: true });
      var ar = "function" == typeof AbortController;
      var ir = function() {
        function WritableStream2(e2, r2) {
          void 0 === e2 && (e2 = {}), void 0 === r2 && (r2 = {}), void 0 === e2 ? e2 = null : L(e2, "First parameter");
          var t2 = Ze(r2, "Second parameter"), o2 = function(e3, r3) {
            I(e3, r3);
            var t3 = null == e3 ? void 0 : e3.abort, o3 = null == e3 ? void 0 : e3.close, n3 = null == e3 ? void 0 : e3.start, a2 = null == e3 ? void 0 : e3.type, i2 = null == e3 ? void 0 : e3.write;
            return { abort: void 0 === t3 ? void 0 : er(t3, e3, r3 + " has member 'abort' that"), close: void 0 === o3 ? void 0 : rr(o3, e3, r3 + " has member 'close' that"), start: void 0 === n3 ? void 0 : tr(n3, e3, r3 + " has member 'start' that"), write: void 0 === i2 ? void 0 : or(i2, e3, r3 + " has member 'write' that"), type: a2 };
          }(e2, "First parameter");
          if (ur(this), void 0 !== o2.type)
            throw new RangeError("Invalid type is specified");
          var n2 = Ke(t2);
          !function(e3, r3, t3, o3) {
            var n3 = Object.create(qr.prototype), a2 = function() {
            }, i2 = function() {
              return d(void 0);
            }, l2 = function() {
              return d(void 0);
            }, u2 = function() {
              return d(void 0);
            };
            void 0 !== r3.start && (a2 = function() {
              return r3.start(n3);
            });
            void 0 !== r3.write && (i2 = function(e4) {
              return r3.write(e4, n3);
            });
            void 0 !== r3.close && (l2 = function() {
              return r3.close();
            });
            void 0 !== r3.abort && (u2 = function(e4) {
              return r3.abort(e4);
            });
            Er(e3, n3, a2, i2, l2, u2, t3, o3);
          }(this, o2, Je(t2, 1), n2);
        }
        return Object.defineProperty(WritableStream2.prototype, "locked", { get: function() {
          if (!sr(this))
            throw Dr("locked");
          return cr(this);
        }, enumerable: false, configurable: true }), WritableStream2.prototype.abort = function(e2) {
          return void 0 === e2 && (e2 = void 0), sr(this) ? cr(this) ? f(new TypeError("Cannot abort a stream that already has a writer")) : dr(this, e2) : f(Dr("abort"));
        }, WritableStream2.prototype.close = function() {
          return sr(this) ? cr(this) ? f(new TypeError("Cannot close a stream that already has a writer")) : hr(this) ? f(new TypeError("Cannot close an already-closing stream")) : fr(this) : f(Dr("close"));
        }, WritableStream2.prototype.getWriter = function() {
          if (!sr(this))
            throw Dr("getWriter");
          return lr(this);
        }, WritableStream2;
      }();
      function lr(e2) {
        return new vr(e2);
      }
      function ur(e2) {
        e2._state = "writable", e2._storedError = void 0, e2._writer = void 0, e2._writableStreamController = void 0, e2._writeRequests = new w(), e2._inFlightWriteRequest = void 0, e2._closeRequest = void 0, e2._inFlightCloseRequest = void 0, e2._pendingAbortRequest = void 0, e2._backpressure = false;
      }
      function sr(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_writableStreamController") && e2 instanceof ir);
      }
      function cr(e2) {
        return void 0 !== e2._writer;
      }
      function dr(e2, r2) {
        var t2;
        if ("closed" === e2._state || "errored" === e2._state)
          return d(void 0);
        e2._writableStreamController._abortReason = r2, null === (t2 = e2._writableStreamController._abortController) || void 0 === t2 || t2.abort();
        var o2 = e2._state;
        if ("closed" === o2 || "errored" === o2)
          return d(void 0);
        if (void 0 !== e2._pendingAbortRequest)
          return e2._pendingAbortRequest._promise;
        var n2 = false;
        "erroring" === o2 && (n2 = true, r2 = void 0);
        var a2 = c(function(t3, o3) {
          e2._pendingAbortRequest = { _promise: void 0, _resolve: t3, _reject: o3, _reason: r2, _wasAlreadyErroring: n2 };
        });
        return e2._pendingAbortRequest._promise = a2, n2 || pr(e2, r2), a2;
      }
      function fr(e2) {
        var r2 = e2._state;
        if ("closed" === r2 || "errored" === r2)
          return f(new TypeError("The stream (in " + r2 + " state) is not in the writable state and cannot be closed"));
        var t2, o2 = c(function(r3, t3) {
          var o3 = { _resolve: r3, _reject: t3 };
          e2._closeRequest = o3;
        }), n2 = e2._writer;
        return void 0 !== n2 && e2._backpressure && "writable" === r2 && Gr(n2), be(t2 = e2._writableStreamController, Pr, 0), Br(t2), o2;
      }
      function br(e2, r2) {
        "writable" !== e2._state ? _r(e2) : pr(e2, r2);
      }
      function pr(e2, r2) {
        var t2 = e2._writableStreamController;
        e2._state = "erroring", e2._storedError = r2;
        var o2 = e2._writer;
        void 0 !== o2 && Rr(o2, r2), !function(e3) {
          if (void 0 === e3._inFlightWriteRequest && void 0 === e3._inFlightCloseRequest)
            return false;
          return true;
        }(e2) && t2._started && _r(e2);
      }
      function _r(e2) {
        e2._state = "errored", e2._writableStreamController[B]();
        var r2 = e2._storedError;
        if (e2._writeRequests.forEach(function(e3) {
          e3._reject(r2);
        }), e2._writeRequests = new w(), void 0 !== e2._pendingAbortRequest) {
          var t2 = e2._pendingAbortRequest;
          if (e2._pendingAbortRequest = void 0, t2._wasAlreadyErroring)
            return t2._reject(r2), void mr(e2);
          p(e2._writableStreamController[j](t2._reason), function() {
            t2._resolve(), mr(e2);
          }, function(r3) {
            t2._reject(r3), mr(e2);
          });
        } else
          mr(e2);
      }
      function hr(e2) {
        return void 0 !== e2._closeRequest || void 0 !== e2._inFlightCloseRequest;
      }
      function mr(e2) {
        void 0 !== e2._closeRequest && (e2._closeRequest._reject(e2._storedError), e2._closeRequest = void 0);
        var r2 = e2._writer;
        void 0 !== r2 && Yr(r2, e2._storedError);
      }
      function yr(e2, r2) {
        var t2 = e2._writer;
        void 0 !== t2 && r2 !== e2._backpressure && (r2 ? function(e3) {
          Nr(e3);
        }(t2) : Gr(t2)), e2._backpressure = r2;
      }
      Object.defineProperties(ir.prototype, { abort: { enumerable: true }, close: { enumerable: true }, getWriter: { enumerable: true }, locked: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(ir.prototype, r.toStringTag, { value: "WritableStream", configurable: true });
      var vr = function() {
        function WritableStreamDefaultWriter2(e2) {
          if (M(e2, 1, "WritableStreamDefaultWriter"), nr(e2, "First parameter"), cr(e2))
            throw new TypeError("This stream has already been locked for exclusive writing by another writer");
          this._ownerWritableStream = e2, e2._writer = this;
          var r2, t2 = e2._state;
          if ("writable" === t2)
            !hr(e2) && e2._backpressure ? Nr(this) : Vr(this), Mr(this);
          else if ("erroring" === t2)
            Hr(this, e2._storedError), Mr(this);
          else if ("closed" === t2)
            Vr(this), Mr(r2 = this), xr(r2);
          else {
            var o2 = e2._storedError;
            Hr(this, o2), Qr(this, o2);
          }
        }
        return Object.defineProperty(WritableStreamDefaultWriter2.prototype, "closed", { get: function() {
          return gr(this) ? this._closedPromise : f(Fr("closed"));
        }, enumerable: false, configurable: true }), Object.defineProperty(WritableStreamDefaultWriter2.prototype, "desiredSize", { get: function() {
          if (!gr(this))
            throw Fr("desiredSize");
          if (void 0 === this._ownerWritableStream)
            throw Lr("desiredSize");
          return function(e2) {
            var r2 = e2._ownerWritableStream, t2 = r2._state;
            if ("errored" === t2 || "erroring" === t2)
              return null;
            if ("closed" === t2)
              return 0;
            return jr(r2._writableStreamController);
          }(this);
        }, enumerable: false, configurable: true }), Object.defineProperty(WritableStreamDefaultWriter2.prototype, "ready", { get: function() {
          return gr(this) ? this._readyPromise : f(Fr("ready"));
        }, enumerable: false, configurable: true }), WritableStreamDefaultWriter2.prototype.abort = function(e2) {
          return void 0 === e2 && (e2 = void 0), gr(this) ? void 0 === this._ownerWritableStream ? f(Lr("abort")) : function(e3, r2) {
            return dr(e3._ownerWritableStream, r2);
          }(this, e2) : f(Fr("abort"));
        }, WritableStreamDefaultWriter2.prototype.close = function() {
          if (!gr(this))
            return f(Fr("close"));
          var e2 = this._ownerWritableStream;
          return void 0 === e2 ? f(Lr("close")) : hr(e2) ? f(new TypeError("Cannot close an already-closing stream")) : Sr(this);
        }, WritableStreamDefaultWriter2.prototype.releaseLock = function() {
          if (!gr(this))
            throw Fr("releaseLock");
          void 0 !== this._ownerWritableStream && Tr(this);
        }, WritableStreamDefaultWriter2.prototype.write = function(e2) {
          return void 0 === e2 && (e2 = void 0), gr(this) ? void 0 === this._ownerWritableStream ? f(Lr("write to")) : Cr(this, e2) : f(Fr("write"));
        }, WritableStreamDefaultWriter2;
      }();
      function gr(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_ownerWritableStream") && e2 instanceof vr);
      }
      function Sr(e2) {
        return fr(e2._ownerWritableStream);
      }
      function wr(e2, r2) {
        "pending" === e2._closedPromiseState ? Yr(e2, r2) : function(e3, r3) {
          Qr(e3, r3);
        }(e2, r2);
      }
      function Rr(e2, r2) {
        "pending" === e2._readyPromiseState ? Ur(e2, r2) : function(e3, r3) {
          Hr(e3, r3);
        }(e2, r2);
      }
      function Tr(e2) {
        var r2 = e2._ownerWritableStream, t2 = new TypeError("Writer was released and can no longer be used to monitor the stream's closedness");
        Rr(e2, t2), wr(e2, t2), r2._writer = void 0, e2._ownerWritableStream = void 0;
      }
      function Cr(e2, r2) {
        var t2 = e2._ownerWritableStream, o2 = t2._writableStreamController, n2 = function(e3, r3) {
          try {
            return e3._strategySizeAlgorithm(r3);
          } catch (r4) {
            return kr(e3, r4), 1;
          }
        }(o2, r2);
        if (t2 !== e2._ownerWritableStream)
          return f(Lr("write to"));
        var a2 = t2._state;
        if ("errored" === a2)
          return f(t2._storedError);
        if (hr(t2) || "closed" === a2)
          return f(new TypeError("The stream is closing or closed and cannot be written to"));
        if ("erroring" === a2)
          return f(t2._storedError);
        var i2 = function(e3) {
          return c(function(r3, t3) {
            var o3 = { _resolve: r3, _reject: t3 };
            e3._writeRequests.push(o3);
          });
        }(t2);
        return function(e3, r3, t3) {
          try {
            be(e3, r3, t3);
          } catch (r4) {
            return void kr(e3, r4);
          }
          var o3 = e3._controlledWritableStream;
          if (!hr(o3) && "writable" === o3._state) {
            yr(o3, Ar(e3));
          }
          Br(e3);
        }(o2, r2, n2), i2;
      }
      Object.defineProperties(vr.prototype, { abort: { enumerable: true }, close: { enumerable: true }, releaseLock: { enumerable: true }, write: { enumerable: true }, closed: { enumerable: true }, desiredSize: { enumerable: true }, ready: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(vr.prototype, r.toStringTag, { value: "WritableStreamDefaultWriter", configurable: true });
      var Pr = {}, qr = function() {
        function WritableStreamDefaultController() {
          throw new TypeError("Illegal constructor");
        }
        return Object.defineProperty(WritableStreamDefaultController.prototype, "abortReason", { get: function() {
          if (!Or(this))
            throw Ir("abortReason");
          return this._abortReason;
        }, enumerable: false, configurable: true }), Object.defineProperty(WritableStreamDefaultController.prototype, "signal", { get: function() {
          if (!Or(this))
            throw Ir("signal");
          if (void 0 === this._abortController)
            throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
          return this._abortController.signal;
        }, enumerable: false, configurable: true }), WritableStreamDefaultController.prototype.error = function(e2) {
          if (void 0 === e2 && (e2 = void 0), !Or(this))
            throw Ir("error");
          "writable" === this._controlledWritableStream._state && zr(this, e2);
        }, WritableStreamDefaultController.prototype[j] = function(e2) {
          var r2 = this._abortAlgorithm(e2);
          return Wr(this), r2;
        }, WritableStreamDefaultController.prototype[B] = function() {
          pe(this);
        }, WritableStreamDefaultController;
      }();
      function Or(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_controlledWritableStream") && e2 instanceof qr);
      }
      function Er(e2, r2, t2, o2, n2, a2, i2, l2) {
        r2._controlledWritableStream = e2, e2._writableStreamController = r2, r2._queue = void 0, r2._queueTotalSize = void 0, pe(r2), r2._abortReason = void 0, r2._abortController = function() {
          if (ar)
            return new AbortController();
        }(), r2._started = false, r2._strategySizeAlgorithm = l2, r2._strategyHWM = i2, r2._writeAlgorithm = o2, r2._closeAlgorithm = n2, r2._abortAlgorithm = a2;
        var u2 = Ar(r2);
        yr(e2, u2), p(d(t2()), function() {
          r2._started = true, Br(r2);
        }, function(t3) {
          r2._started = true, br(e2, t3);
        });
      }
      function Wr(e2) {
        e2._writeAlgorithm = void 0, e2._closeAlgorithm = void 0, e2._abortAlgorithm = void 0, e2._strategySizeAlgorithm = void 0;
      }
      function jr(e2) {
        return e2._strategyHWM - e2._queueTotalSize;
      }
      function Br(e2) {
        var r2 = e2._controlledWritableStream;
        if (e2._started && void 0 === r2._inFlightWriteRequest)
          if ("erroring" !== r2._state) {
            if (0 !== e2._queue.length) {
              var t2 = e2._queue.peek().value;
              t2 === Pr ? function(e3) {
                var r3 = e3._controlledWritableStream;
                (function(e4) {
                  e4._inFlightCloseRequest = e4._closeRequest, e4._closeRequest = void 0;
                })(r3), fe(e3);
                var t3 = e3._closeAlgorithm();
                Wr(e3), p(t3, function() {
                  !function(e4) {
                    e4._inFlightCloseRequest._resolve(void 0), e4._inFlightCloseRequest = void 0, "erroring" === e4._state && (e4._storedError = void 0, void 0 !== e4._pendingAbortRequest && (e4._pendingAbortRequest._resolve(), e4._pendingAbortRequest = void 0)), e4._state = "closed";
                    var r4 = e4._writer;
                    void 0 !== r4 && xr(r4);
                  }(r3);
                }, function(e4) {
                  !function(e5, r4) {
                    e5._inFlightCloseRequest._reject(r4), e5._inFlightCloseRequest = void 0, void 0 !== e5._pendingAbortRequest && (e5._pendingAbortRequest._reject(r4), e5._pendingAbortRequest = void 0), br(e5, r4);
                  }(r3, e4);
                });
              }(e2) : function(e3, r3) {
                var t3 = e3._controlledWritableStream;
                (function(e4) {
                  e4._inFlightWriteRequest = e4._writeRequests.shift();
                })(t3), p(e3._writeAlgorithm(r3), function() {
                  !function(e4) {
                    e4._inFlightWriteRequest._resolve(void 0), e4._inFlightWriteRequest = void 0;
                  }(t3);
                  var r4 = t3._state;
                  if (fe(e3), !hr(t3) && "writable" === r4) {
                    var o2 = Ar(e3);
                    yr(t3, o2);
                  }
                  Br(e3);
                }, function(r4) {
                  "writable" === t3._state && Wr(e3), function(e4, r5) {
                    e4._inFlightWriteRequest._reject(r5), e4._inFlightWriteRequest = void 0, br(e4, r5);
                  }(t3, r4);
                });
              }(e2, t2);
            }
          } else
            _r(r2);
      }
      function kr(e2, r2) {
        "writable" === e2._controlledWritableStream._state && zr(e2, r2);
      }
      function Ar(e2) {
        return jr(e2) <= 0;
      }
      function zr(e2, r2) {
        var t2 = e2._controlledWritableStream;
        Wr(e2), pr(t2, r2);
      }
      function Dr(e2) {
        return new TypeError("WritableStream.prototype." + e2 + " can only be used on a WritableStream");
      }
      function Ir(e2) {
        return new TypeError("WritableStreamDefaultController.prototype." + e2 + " can only be used on a WritableStreamDefaultController");
      }
      function Fr(e2) {
        return new TypeError("WritableStreamDefaultWriter.prototype." + e2 + " can only be used on a WritableStreamDefaultWriter");
      }
      function Lr(e2) {
        return new TypeError("Cannot " + e2 + " a stream using a released writer");
      }
      function Mr(e2) {
        e2._closedPromise = c(function(r2, t2) {
          e2._closedPromise_resolve = r2, e2._closedPromise_reject = t2, e2._closedPromiseState = "pending";
        });
      }
      function Qr(e2, r2) {
        Mr(e2), Yr(e2, r2);
      }
      function Yr(e2, r2) {
        void 0 !== e2._closedPromise_reject && (y(e2._closedPromise), e2._closedPromise_reject(r2), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0, e2._closedPromiseState = "rejected");
      }
      function xr(e2) {
        void 0 !== e2._closedPromise_resolve && (e2._closedPromise_resolve(void 0), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0, e2._closedPromiseState = "resolved");
      }
      function Nr(e2) {
        e2._readyPromise = c(function(r2, t2) {
          e2._readyPromise_resolve = r2, e2._readyPromise_reject = t2;
        }), e2._readyPromiseState = "pending";
      }
      function Hr(e2, r2) {
        Nr(e2), Ur(e2, r2);
      }
      function Vr(e2) {
        Nr(e2), Gr(e2);
      }
      function Ur(e2, r2) {
        void 0 !== e2._readyPromise_reject && (y(e2._readyPromise), e2._readyPromise_reject(r2), e2._readyPromise_resolve = void 0, e2._readyPromise_reject = void 0, e2._readyPromiseState = "rejected");
      }
      function Gr(e2) {
        void 0 !== e2._readyPromise_resolve && (e2._readyPromise_resolve(void 0), e2._readyPromise_resolve = void 0, e2._readyPromise_reject = void 0, e2._readyPromiseState = "fulfilled");
      }
      Object.defineProperties(qr.prototype, { abortReason: { enumerable: true }, signal: { enumerable: true }, error: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(qr.prototype, r.toStringTag, { value: "WritableStreamDefaultController", configurable: true });
      var Xr = "undefined" != typeof DOMException ? DOMException : void 0;
      var Jr, Kr = function(e2) {
        if ("function" != typeof e2 && "object" != typeof e2)
          return false;
        try {
          return new e2(), true;
        } catch (e3) {
          return false;
        }
      }(Xr) ? Xr : ((Jr = function(e2, r2) {
        this.message = e2 || "", this.name = r2 || "Error", Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
      }).prototype = Object.create(Error.prototype), Object.defineProperty(Jr.prototype, "constructor", { value: Jr, writable: true, configurable: true }), Jr);
      function Zr(e2, r2, o2, n2, a2, i2) {
        var l2 = V(e2), u2 = lr(r2);
        e2._disturbed = true;
        var s2 = false, m2 = d(void 0);
        return c(function(v2, g2) {
          var S2, w2, R2, T2;
          if (void 0 !== i2) {
            if (S2 = function() {
              var t2 = new Kr("Aborted", "AbortError"), o3 = [];
              n2 || o3.push(function() {
                return "writable" === r2._state ? dr(r2, t2) : d(void 0);
              }), a2 || o3.push(function() {
                return "readable" === e2._state ? Tt(e2, t2) : d(void 0);
              }), E2(function() {
                return Promise.all(o3.map(function(e3) {
                  return e3();
                }));
              }, true, t2);
            }, i2.aborted)
              return void S2();
            i2.addEventListener("abort", S2);
          }
          if (O2(e2, l2._closedPromise, function(e3) {
            n2 ? W2(true, e3) : E2(function() {
              return dr(r2, e3);
            }, true, e3);
          }), O2(r2, u2._closedPromise, function(r3) {
            a2 ? W2(true, r3) : E2(function() {
              return Tt(e2, r3);
            }, true, r3);
          }), w2 = e2, R2 = l2._closedPromise, T2 = function() {
            o2 ? W2() : E2(function() {
              return function(e3) {
                var r3 = e3._ownerWritableStream, t2 = r3._state;
                return hr(r3) || "closed" === t2 ? d(void 0) : "errored" === t2 ? f(r3._storedError) : Sr(e3);
              }(u2);
            });
          }, "closed" === w2._state ? T2() : _(R2, T2), hr(r2) || "closed" === r2._state) {
            var P2 = new TypeError("the destination writable stream closed before all data could be piped to it");
            a2 ? W2(true, P2) : E2(function() {
              return Tt(e2, P2);
            }, true, P2);
          }
          function q2() {
            var e3 = m2;
            return b(m2, function() {
              return e3 !== m2 ? q2() : void 0;
            });
          }
          function O2(e3, r3, t2) {
            "errored" === e3._state ? t2(e3._storedError) : h(r3, t2);
          }
          function E2(e3, t2, o3) {
            function n3() {
              p(e3(), function() {
                return j2(t2, o3);
              }, function(e4) {
                return j2(true, e4);
              });
            }
            s2 || (s2 = true, "writable" !== r2._state || hr(r2) ? n3() : _(q2(), n3));
          }
          function W2(e3, t2) {
            s2 || (s2 = true, "writable" !== r2._state || hr(r2) ? j2(e3, t2) : _(q2(), function() {
              return j2(e3, t2);
            }));
          }
          function j2(e3, r3) {
            Tr(u2), C(l2), void 0 !== i2 && i2.removeEventListener("abort", S2), e3 ? g2(r3) : v2(void 0);
          }
          y(c(function(e3, r3) {
            !function o3(n3) {
              n3 ? e3() : b(s2 ? d(true) : b(u2._readyPromise, function() {
                return c(function(e4, r4) {
                  re(l2, { _chunkSteps: function(r5) {
                    m2 = b(Cr(u2, r5), void 0, t), e4(false);
                  }, _closeSteps: function() {
                    return e4(true);
                  }, _errorSteps: r4 });
                });
              }), o3, r3);
            }(false);
          }));
        });
      }
      var $r = function() {
        function ReadableStreamDefaultController() {
          throw new TypeError("Illegal constructor");
        }
        return Object.defineProperty(ReadableStreamDefaultController.prototype, "desiredSize", { get: function() {
          if (!et(this))
            throw ct("desiredSize");
          return lt(this);
        }, enumerable: false, configurable: true }), ReadableStreamDefaultController.prototype.close = function() {
          if (!et(this))
            throw ct("close");
          if (!ut(this))
            throw new TypeError("The stream is not in a state that permits close");
          nt(this);
        }, ReadableStreamDefaultController.prototype.enqueue = function(e2) {
          if (void 0 === e2 && (e2 = void 0), !et(this))
            throw ct("enqueue");
          if (!ut(this))
            throw new TypeError("The stream is not in a state that permits enqueue");
          return at(this, e2);
        }, ReadableStreamDefaultController.prototype.error = function(e2) {
          if (void 0 === e2 && (e2 = void 0), !et(this))
            throw ct("error");
          it(this, e2);
        }, ReadableStreamDefaultController.prototype[k] = function(e2) {
          pe(this);
          var r2 = this._cancelAlgorithm(e2);
          return ot(this), r2;
        }, ReadableStreamDefaultController.prototype[A] = function(e2) {
          var r2 = this._controlledReadableStream;
          if (this._queue.length > 0) {
            var t2 = fe(this);
            this._closeRequested && 0 === this._queue.length ? (ot(this), Ct(r2)) : rt(this), e2._chunkSteps(t2);
          } else
            U(r2, e2), rt(this);
        }, ReadableStreamDefaultController;
      }();
      function et(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_controlledReadableStream") && e2 instanceof $r);
      }
      function rt(e2) {
        tt(e2) && (e2._pulling ? e2._pullAgain = true : (e2._pulling = true, p(e2._pullAlgorithm(), function() {
          e2._pulling = false, e2._pullAgain && (e2._pullAgain = false, rt(e2));
        }, function(r2) {
          it(e2, r2);
        })));
      }
      function tt(e2) {
        var r2 = e2._controlledReadableStream;
        return !!ut(e2) && (!!e2._started && (!!(Rt(r2) && X(r2) > 0) || lt(e2) > 0));
      }
      function ot(e2) {
        e2._pullAlgorithm = void 0, e2._cancelAlgorithm = void 0, e2._strategySizeAlgorithm = void 0;
      }
      function nt(e2) {
        if (ut(e2)) {
          var r2 = e2._controlledReadableStream;
          e2._closeRequested = true, 0 === e2._queue.length && (ot(e2), Ct(r2));
        }
      }
      function at(e2, r2) {
        if (ut(e2)) {
          var t2 = e2._controlledReadableStream;
          if (Rt(t2) && X(t2) > 0)
            G(t2, r2, false);
          else {
            var o2 = void 0;
            try {
              o2 = e2._strategySizeAlgorithm(r2);
            } catch (r3) {
              throw it(e2, r3), r3;
            }
            try {
              be(e2, r2, o2);
            } catch (r3) {
              throw it(e2, r3), r3;
            }
          }
          rt(e2);
        }
      }
      function it(e2, r2) {
        var t2 = e2._controlledReadableStream;
        "readable" === t2._state && (pe(e2), ot(e2), Pt(t2, r2));
      }
      function lt(e2) {
        var r2 = e2._controlledReadableStream._state;
        return "errored" === r2 ? null : "closed" === r2 ? 0 : e2._strategyHWM - e2._queueTotalSize;
      }
      function ut(e2) {
        var r2 = e2._controlledReadableStream._state;
        return !e2._closeRequested && "readable" === r2;
      }
      function st(e2, r2, t2, o2, n2, a2, i2) {
        r2._controlledReadableStream = e2, r2._queue = void 0, r2._queueTotalSize = void 0, pe(r2), r2._started = false, r2._closeRequested = false, r2._pullAgain = false, r2._pulling = false, r2._strategySizeAlgorithm = i2, r2._strategyHWM = a2, r2._pullAlgorithm = o2, r2._cancelAlgorithm = n2, e2._readableStreamController = r2, p(d(t2()), function() {
          r2._started = true, rt(r2);
        }, function(e3) {
          it(r2, e3);
        });
      }
      function ct(e2) {
        return new TypeError("ReadableStreamDefaultController.prototype." + e2 + " can only be used on a ReadableStreamDefaultController");
      }
      function dt(e2, r2) {
        return me(e2._readableStreamController) ? function(e3) {
          var r3, t2, o2, n2, a2, i2 = V(e3), l2 = false, u2 = false, s2 = false, f2 = false, b2 = false, p2 = c(function(e4) {
            a2 = e4;
          });
          function _2(e4) {
            h(e4._closedPromise, function(r4) {
              e4 === i2 && (Ae(o2._readableStreamController, r4), Ae(n2._readableStreamController, r4), f2 && b2 || a2(void 0));
            });
          }
          function m2() {
            Ue(i2) && (C(i2), _2(i2 = V(e3))), re(i2, { _chunkSteps: function(r4) {
              v(function() {
                u2 = false, s2 = false;
                var t3 = r4, i3 = r4;
                if (!f2 && !b2)
                  try {
                    i3 = de(r4);
                  } catch (r5) {
                    return Ae(o2._readableStreamController, r5), Ae(n2._readableStreamController, r5), void a2(Tt(e3, r5));
                  }
                f2 || ke(o2._readableStreamController, t3), b2 || ke(n2._readableStreamController, i3), l2 = false, u2 ? g2() : s2 && S2();
              });
            }, _closeSteps: function() {
              l2 = false, f2 || Be(o2._readableStreamController), b2 || Be(n2._readableStreamController), o2._readableStreamController._pendingPullIntos.length > 0 && Ie(o2._readableStreamController, 0), n2._readableStreamController._pendingPullIntos.length > 0 && Ie(n2._readableStreamController, 0), f2 && b2 || a2(void 0);
            }, _errorSteps: function() {
              l2 = false;
            } });
          }
          function y2(r4, t3) {
            ee(i2) && (C(i2), _2(i2 = Ye(e3)));
            var c2 = t3 ? n2 : o2, d2 = t3 ? o2 : n2;
            Ge(i2, r4, { _chunkSteps: function(r5) {
              v(function() {
                u2 = false, s2 = false;
                var o3 = t3 ? b2 : f2;
                if (t3 ? f2 : b2)
                  o3 || Fe(c2._readableStreamController, r5);
                else {
                  var n3 = void 0;
                  try {
                    n3 = de(r5);
                  } catch (r6) {
                    return Ae(c2._readableStreamController, r6), Ae(d2._readableStreamController, r6), void a2(Tt(e3, r6));
                  }
                  o3 || Fe(c2._readableStreamController, r5), ke(d2._readableStreamController, n3);
                }
                l2 = false, u2 ? g2() : s2 && S2();
              });
            }, _closeSteps: function(e4) {
              l2 = false;
              var r5 = t3 ? b2 : f2, o3 = t3 ? f2 : b2;
              r5 || Be(c2._readableStreamController), o3 || Be(d2._readableStreamController), void 0 !== e4 && (r5 || Fe(c2._readableStreamController, e4), !o3 && d2._readableStreamController._pendingPullIntos.length > 0 && Ie(d2._readableStreamController, 0)), r5 && o3 || a2(void 0);
            }, _errorSteps: function() {
              l2 = false;
            } });
          }
          function g2() {
            if (l2)
              return u2 = true, d(void 0);
            l2 = true;
            var e4 = ze(o2._readableStreamController);
            return null === e4 ? m2() : y2(e4._view, false), d(void 0);
          }
          function S2() {
            if (l2)
              return s2 = true, d(void 0);
            l2 = true;
            var e4 = ze(n2._readableStreamController);
            return null === e4 ? m2() : y2(e4._view, true), d(void 0);
          }
          function w2(o3) {
            if (f2 = true, r3 = o3, b2) {
              var n3 = ue([r3, t2]), i3 = Tt(e3, n3);
              a2(i3);
            }
            return p2;
          }
          function R2(o3) {
            if (b2 = true, t2 = o3, f2) {
              var n3 = ue([r3, t2]), i3 = Tt(e3, n3);
              a2(i3);
            }
            return p2;
          }
          function T2() {
          }
          return o2 = gt(T2, g2, w2), n2 = gt(T2, S2, R2), _2(i2), [o2, n2];
        }(e2) : function(e3, r3) {
          var t2, o2, n2, a2, i2, l2 = V(e3), u2 = false, s2 = false, f2 = false, b2 = false, p2 = c(function(e4) {
            i2 = e4;
          });
          function _2() {
            return u2 ? (s2 = true, d(void 0)) : (u2 = true, re(l2, { _chunkSteps: function(e4) {
              v(function() {
                s2 = false;
                var r4 = e4, t3 = e4;
                f2 || at(n2._readableStreamController, r4), b2 || at(a2._readableStreamController, t3), u2 = false, s2 && _2();
              });
            }, _closeSteps: function() {
              u2 = false, f2 || nt(n2._readableStreamController), b2 || nt(a2._readableStreamController), f2 && b2 || i2(void 0);
            }, _errorSteps: function() {
              u2 = false;
            } }), d(void 0));
          }
          function m2(r4) {
            if (f2 = true, t2 = r4, b2) {
              var n3 = ue([t2, o2]), a3 = Tt(e3, n3);
              i2(a3);
            }
            return p2;
          }
          function y2(r4) {
            if (b2 = true, o2 = r4, f2) {
              var n3 = ue([t2, o2]), a3 = Tt(e3, n3);
              i2(a3);
            }
            return p2;
          }
          function g2() {
          }
          return n2 = vt(g2, _2, m2), a2 = vt(g2, _2, y2), h(l2._closedPromise, function(e4) {
            it(n2._readableStreamController, e4), it(a2._readableStreamController, e4), f2 && b2 || i2(void 0);
          }), [n2, a2];
        }(e2);
      }
      function ft(e2, r2, t2) {
        return F(e2, t2), function(t3) {
          return S(e2, r2, [t3]);
        };
      }
      function bt(e2, r2, t2) {
        return F(e2, t2), function(t3) {
          return S(e2, r2, [t3]);
        };
      }
      function pt(e2, r2, t2) {
        return F(e2, t2), function(t3) {
          return g(e2, r2, [t3]);
        };
      }
      function _t(e2, r2) {
        if ("bytes" !== (e2 = "" + e2))
          throw new TypeError(r2 + " '" + e2 + "' is not a valid enumeration value for ReadableStreamType");
        return e2;
      }
      function ht(e2, r2) {
        if ("byob" !== (e2 = "" + e2))
          throw new TypeError(r2 + " '" + e2 + "' is not a valid enumeration value for ReadableStreamReaderMode");
        return e2;
      }
      function mt(e2, r2) {
        I(e2, r2);
        var t2 = null == e2 ? void 0 : e2.preventAbort, o2 = null == e2 ? void 0 : e2.preventCancel, n2 = null == e2 ? void 0 : e2.preventClose, a2 = null == e2 ? void 0 : e2.signal;
        return void 0 !== a2 && function(e3, r3) {
          if (!function(e4) {
            if ("object" != typeof e4 || null === e4)
              return false;
            try {
              return "boolean" == typeof e4.aborted;
            } catch (e5) {
              return false;
            }
          }(e3))
            throw new TypeError(r3 + " is not an AbortSignal.");
        }(a2, r2 + " has member 'signal' that"), { preventAbort: Boolean(t2), preventCancel: Boolean(o2), preventClose: Boolean(n2), signal: a2 };
      }
      Object.defineProperties($r.prototype, { close: { enumerable: true }, enqueue: { enumerable: true }, error: { enumerable: true }, desiredSize: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty($r.prototype, r.toStringTag, { value: "ReadableStreamDefaultController", configurable: true });
      var yt = function() {
        function ReadableStream3(e2, r2) {
          void 0 === e2 && (e2 = {}), void 0 === r2 && (r2 = {}), void 0 === e2 ? e2 = null : L(e2, "First parameter");
          var t2 = Ze(r2, "Second parameter"), o2 = function(e3, r3) {
            I(e3, r3);
            var t3 = e3, o3 = null == t3 ? void 0 : t3.autoAllocateChunkSize, n3 = null == t3 ? void 0 : t3.cancel, a2 = null == t3 ? void 0 : t3.pull, i2 = null == t3 ? void 0 : t3.start, l2 = null == t3 ? void 0 : t3.type;
            return { autoAllocateChunkSize: void 0 === o3 ? void 0 : N(o3, r3 + " has member 'autoAllocateChunkSize' that"), cancel: void 0 === n3 ? void 0 : ft(n3, t3, r3 + " has member 'cancel' that"), pull: void 0 === a2 ? void 0 : bt(a2, t3, r3 + " has member 'pull' that"), start: void 0 === i2 ? void 0 : pt(i2, t3, r3 + " has member 'start' that"), type: void 0 === l2 ? void 0 : _t(l2, r3 + " has member 'type' that") };
          }(e2, "First parameter");
          if (St(this), "bytes" === o2.type) {
            if (void 0 !== t2.size)
              throw new RangeError("The strategy for a byte stream cannot have a size function");
            !function(e3, r3, t3) {
              var o3 = Object.create(he.prototype), n3 = function() {
              }, a2 = function() {
                return d(void 0);
              }, i2 = function() {
                return d(void 0);
              };
              void 0 !== r3.start && (n3 = function() {
                return r3.start(o3);
              }), void 0 !== r3.pull && (a2 = function() {
                return r3.pull(o3);
              }), void 0 !== r3.cancel && (i2 = function(e4) {
                return r3.cancel(e4);
              });
              var l2 = r3.autoAllocateChunkSize;
              if (0 === l2)
                throw new TypeError("autoAllocateChunkSize must be greater than 0");
              Le(e3, o3, n3, a2, i2, t3, l2);
            }(this, o2, Je(t2, 0));
          } else {
            var n2 = Ke(t2);
            !function(e3, r3, t3, o3) {
              var n3 = Object.create($r.prototype), a2 = function() {
              }, i2 = function() {
                return d(void 0);
              }, l2 = function() {
                return d(void 0);
              };
              void 0 !== r3.start && (a2 = function() {
                return r3.start(n3);
              }), void 0 !== r3.pull && (i2 = function() {
                return r3.pull(n3);
              }), void 0 !== r3.cancel && (l2 = function(e4) {
                return r3.cancel(e4);
              }), st(e3, n3, a2, i2, l2, t3, o3);
            }(this, o2, Je(t2, 1), n2);
          }
        }
        return Object.defineProperty(ReadableStream3.prototype, "locked", { get: function() {
          if (!wt(this))
            throw qt("locked");
          return Rt(this);
        }, enumerable: false, configurable: true }), ReadableStream3.prototype.cancel = function(e2) {
          return void 0 === e2 && (e2 = void 0), wt(this) ? Rt(this) ? f(new TypeError("Cannot cancel a stream that already has a reader")) : Tt(this, e2) : f(qt("cancel"));
        }, ReadableStream3.prototype.getReader = function(e2) {
          if (void 0 === e2 && (e2 = void 0), !wt(this))
            throw qt("getReader");
          return void 0 === function(e3, r2) {
            I(e3, r2);
            var t2 = null == e3 ? void 0 : e3.mode;
            return { mode: void 0 === t2 ? void 0 : ht(t2, r2 + " has member 'mode' that") };
          }(e2, "First parameter").mode ? V(this) : Ye(this);
        }, ReadableStream3.prototype.pipeThrough = function(e2, r2) {
          if (void 0 === r2 && (r2 = {}), !wt(this))
            throw qt("pipeThrough");
          M(e2, 1, "pipeThrough");
          var t2 = function(e3, r3) {
            I(e3, r3);
            var t3 = null == e3 ? void 0 : e3.readable;
            Q(t3, "readable", "ReadableWritablePair"), H(t3, r3 + " has member 'readable' that");
            var o3 = null == e3 ? void 0 : e3.writable;
            return Q(o3, "writable", "ReadableWritablePair"), nr(o3, r3 + " has member 'writable' that"), { readable: t3, writable: o3 };
          }(e2, "First parameter"), o2 = mt(r2, "Second parameter");
          if (Rt(this))
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
          if (cr(t2.writable))
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
          return y(Zr(this, t2.writable, o2.preventClose, o2.preventAbort, o2.preventCancel, o2.signal)), t2.readable;
        }, ReadableStream3.prototype.pipeTo = function(e2, r2) {
          if (void 0 === r2 && (r2 = {}), !wt(this))
            return f(qt("pipeTo"));
          if (void 0 === e2)
            return f("Parameter 1 is required in 'pipeTo'.");
          if (!sr(e2))
            return f(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
          var t2;
          try {
            t2 = mt(r2, "Second parameter");
          } catch (e3) {
            return f(e3);
          }
          return Rt(this) ? f(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream")) : cr(e2) ? f(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream")) : Zr(this, e2, t2.preventClose, t2.preventAbort, t2.preventCancel, t2.signal);
        }, ReadableStream3.prototype.tee = function() {
          if (!wt(this))
            throw qt("tee");
          return ue(dt(this));
        }, ReadableStream3.prototype.values = function(e2) {
          if (void 0 === e2 && (e2 = void 0), !wt(this))
            throw qt("values");
          var r2, t2, o2, n2, a2, i2 = function(e3, r3) {
            I(e3, r3);
            var t3 = null == e3 ? void 0 : e3.preventCancel;
            return { preventCancel: Boolean(t3) };
          }(e2, "First parameter");
          return r2 = this, t2 = i2.preventCancel, o2 = V(r2), n2 = new oe(o2, t2), (a2 = Object.create(ne))._asyncIteratorImpl = n2, a2;
        }, ReadableStream3;
      }();
      function vt(e2, r2, t2, o2, n2) {
        void 0 === o2 && (o2 = 1), void 0 === n2 && (n2 = function() {
          return 1;
        });
        var a2 = Object.create(yt.prototype);
        return St(a2), st(a2, Object.create($r.prototype), e2, r2, t2, o2, n2), a2;
      }
      function gt(e2, r2, t2) {
        var o2 = Object.create(yt.prototype);
        return St(o2), Le(o2, Object.create(he.prototype), e2, r2, t2, 0, void 0), o2;
      }
      function St(e2) {
        e2._state = "readable", e2._reader = void 0, e2._storedError = void 0, e2._disturbed = false;
      }
      function wt(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_readableStreamController") && e2 instanceof yt);
      }
      function Rt(e2) {
        return void 0 !== e2._reader;
      }
      function Tt(e2, r2) {
        if (e2._disturbed = true, "closed" === e2._state)
          return d(void 0);
        if ("errored" === e2._state)
          return f(e2._storedError);
        Ct(e2);
        var o2 = e2._reader;
        return void 0 !== o2 && Ue(o2) && (o2._readIntoRequests.forEach(function(e3) {
          e3._closeSteps(void 0);
        }), o2._readIntoRequests = new w()), m(e2._readableStreamController[k](r2), t);
      }
      function Ct(e2) {
        e2._state = "closed";
        var r2 = e2._reader;
        void 0 !== r2 && (W(r2), ee(r2) && (r2._readRequests.forEach(function(e3) {
          e3._closeSteps();
        }), r2._readRequests = new w()));
      }
      function Pt(e2, r2) {
        e2._state = "errored", e2._storedError = r2;
        var t2 = e2._reader;
        void 0 !== t2 && (E(t2, r2), ee(t2) ? (t2._readRequests.forEach(function(e3) {
          e3._errorSteps(r2);
        }), t2._readRequests = new w()) : (t2._readIntoRequests.forEach(function(e3) {
          e3._errorSteps(r2);
        }), t2._readIntoRequests = new w()));
      }
      function qt(e2) {
        return new TypeError("ReadableStream.prototype." + e2 + " can only be used on a ReadableStream");
      }
      function Ot(e2, r2) {
        I(e2, r2);
        var t2 = null == e2 ? void 0 : e2.highWaterMark;
        return Q(t2, "highWaterMark", "QueuingStrategyInit"), { highWaterMark: Y(t2) };
      }
      Object.defineProperties(yt.prototype, { cancel: { enumerable: true }, getReader: { enumerable: true }, pipeThrough: { enumerable: true }, pipeTo: { enumerable: true }, tee: { enumerable: true }, values: { enumerable: true }, locked: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(yt.prototype, r.toStringTag, { value: "ReadableStream", configurable: true }), "symbol" == typeof r.asyncIterator && Object.defineProperty(yt.prototype, r.asyncIterator, { value: yt.prototype.values, writable: true, configurable: true });
      var Et = function(e2) {
        return e2.byteLength;
      };
      try {
        Object.defineProperty(Et, "name", { value: "size", configurable: true });
      } catch (K2) {
      }
      var Wt = function() {
        function ByteLengthQueuingStrategy(e2) {
          M(e2, 1, "ByteLengthQueuingStrategy"), e2 = Ot(e2, "First parameter"), this._byteLengthQueuingStrategyHighWaterMark = e2.highWaterMark;
        }
        return Object.defineProperty(ByteLengthQueuingStrategy.prototype, "highWaterMark", { get: function() {
          if (!Bt(this))
            throw jt("highWaterMark");
          return this._byteLengthQueuingStrategyHighWaterMark;
        }, enumerable: false, configurable: true }), Object.defineProperty(ByteLengthQueuingStrategy.prototype, "size", { get: function() {
          if (!Bt(this))
            throw jt("size");
          return Et;
        }, enumerable: false, configurable: true }), ByteLengthQueuingStrategy;
      }();
      function jt(e2) {
        return new TypeError("ByteLengthQueuingStrategy.prototype." + e2 + " can only be used on a ByteLengthQueuingStrategy");
      }
      function Bt(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_byteLengthQueuingStrategyHighWaterMark") && e2 instanceof Wt);
      }
      Object.defineProperties(Wt.prototype, { highWaterMark: { enumerable: true }, size: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(Wt.prototype, r.toStringTag, { value: "ByteLengthQueuingStrategy", configurable: true });
      var kt = function() {
        return 1;
      };
      try {
        Object.defineProperty(kt, "name", { value: "size", configurable: true });
      } catch (K2) {
      }
      var At = function() {
        function CountQueuingStrategy(e2) {
          M(e2, 1, "CountQueuingStrategy"), e2 = Ot(e2, "First parameter"), this._countQueuingStrategyHighWaterMark = e2.highWaterMark;
        }
        return Object.defineProperty(CountQueuingStrategy.prototype, "highWaterMark", { get: function() {
          if (!Dt(this))
            throw zt("highWaterMark");
          return this._countQueuingStrategyHighWaterMark;
        }, enumerable: false, configurable: true }), Object.defineProperty(CountQueuingStrategy.prototype, "size", { get: function() {
          if (!Dt(this))
            throw zt("size");
          return kt;
        }, enumerable: false, configurable: true }), CountQueuingStrategy;
      }();
      function zt(e2) {
        return new TypeError("CountQueuingStrategy.prototype." + e2 + " can only be used on a CountQueuingStrategy");
      }
      function Dt(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_countQueuingStrategyHighWaterMark") && e2 instanceof At);
      }
      function It(e2, r2, t2) {
        return F(e2, t2), function(t3) {
          return S(e2, r2, [t3]);
        };
      }
      function Ft(e2, r2, t2) {
        return F(e2, t2), function(t3) {
          return g(e2, r2, [t3]);
        };
      }
      function Lt(e2, r2, t2) {
        return F(e2, t2), function(t3, o2) {
          return S(e2, r2, [t3, o2]);
        };
      }
      Object.defineProperties(At.prototype, { highWaterMark: { enumerable: true }, size: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(At.prototype, r.toStringTag, { value: "CountQueuingStrategy", configurable: true });
      var Mt = function() {
        function TransformStream3(e2, r2, t2) {
          void 0 === e2 && (e2 = {}), void 0 === r2 && (r2 = {}), void 0 === t2 && (t2 = {}), void 0 === e2 && (e2 = null);
          var o2 = Ze(r2, "Second parameter"), n2 = Ze(t2, "Third parameter"), a2 = function(e3, r3) {
            I(e3, r3);
            var t3 = null == e3 ? void 0 : e3.flush, o3 = null == e3 ? void 0 : e3.readableType, n3 = null == e3 ? void 0 : e3.start, a3 = null == e3 ? void 0 : e3.transform, i3 = null == e3 ? void 0 : e3.writableType;
            return { flush: void 0 === t3 ? void 0 : It(t3, e3, r3 + " has member 'flush' that"), readableType: o3, start: void 0 === n3 ? void 0 : Ft(n3, e3, r3 + " has member 'start' that"), transform: void 0 === a3 ? void 0 : Lt(a3, e3, r3 + " has member 'transform' that"), writableType: i3 };
          }(e2, "First parameter");
          if (void 0 !== a2.readableType)
            throw new RangeError("Invalid readableType specified");
          if (void 0 !== a2.writableType)
            throw new RangeError("Invalid writableType specified");
          var i2, l2 = Je(n2, 0), u2 = Ke(n2), s2 = Je(o2, 1), b2 = Ke(o2);
          !function(e3, r3, t3, o3, n3, a3) {
            function i3() {
              return r3;
            }
            function l3(r4) {
              return function(e4, r5) {
                var t4 = e4._transformStreamController;
                if (e4._backpressure) {
                  return m(e4._backpressureChangePromise, function() {
                    var o4 = e4._writable;
                    if ("erroring" === o4._state)
                      throw o4._storedError;
                    return Xt(t4, r5);
                  });
                }
                return Xt(t4, r5);
              }(e3, r4);
            }
            function u3(r4) {
              return function(e4, r5) {
                return Yt(e4, r5), d(void 0);
              }(e3, r4);
            }
            function s3() {
              return function(e4) {
                var r4 = e4._readable, t4 = e4._transformStreamController, o4 = t4._flushAlgorithm();
                return Ut(t4), m(o4, function() {
                  if ("errored" === r4._state)
                    throw r4._storedError;
                  nt(r4._readableStreamController);
                }, function(t5) {
                  throw Yt(e4, t5), r4._storedError;
                });
              }(e3);
            }
            function c2() {
              return function(e4) {
                return Nt(e4, false), e4._backpressureChangePromise;
              }(e3);
            }
            function f2(r4) {
              return xt(e3, r4), d(void 0);
            }
            e3._writable = function(e4, r4, t4, o4, n4, a4) {
              void 0 === n4 && (n4 = 1), void 0 === a4 && (a4 = function() {
                return 1;
              });
              var i4 = Object.create(ir.prototype);
              return ur(i4), Er(i4, Object.create(qr.prototype), e4, r4, t4, o4, n4, a4), i4;
            }(i3, l3, s3, u3, t3, o3), e3._readable = vt(i3, c2, f2, n3, a3), e3._backpressure = void 0, e3._backpressureChangePromise = void 0, e3._backpressureChangePromise_resolve = void 0, Nt(e3, true), e3._transformStreamController = void 0;
          }(this, c(function(e3) {
            i2 = e3;
          }), s2, b2, l2, u2), function(e3, r3) {
            var t3 = Object.create(Ht.prototype), o3 = function(e4) {
              try {
                return Gt(t3, e4), d(void 0);
              } catch (e5) {
                return f(e5);
              }
            }, n3 = function() {
              return d(void 0);
            };
            void 0 !== r3.transform && (o3 = function(e4) {
              return r3.transform(e4, t3);
            });
            void 0 !== r3.flush && (n3 = function() {
              return r3.flush(t3);
            });
            !function(e4, r4, t4, o4) {
              r4._controlledTransformStream = e4, e4._transformStreamController = r4, r4._transformAlgorithm = t4, r4._flushAlgorithm = o4;
            }(e3, t3, o3, n3);
          }(this, a2), void 0 !== a2.start ? i2(a2.start(this._transformStreamController)) : i2(void 0);
        }
        return Object.defineProperty(TransformStream3.prototype, "readable", { get: function() {
          if (!Qt(this))
            throw Kt("readable");
          return this._readable;
        }, enumerable: false, configurable: true }), Object.defineProperty(TransformStream3.prototype, "writable", { get: function() {
          if (!Qt(this))
            throw Kt("writable");
          return this._writable;
        }, enumerable: false, configurable: true }), TransformStream3;
      }();
      function Qt(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_transformStreamController") && e2 instanceof Mt);
      }
      function Yt(e2, r2) {
        it(e2._readable._readableStreamController, r2), xt(e2, r2);
      }
      function xt(e2, r2) {
        Ut(e2._transformStreamController), kr(e2._writable._writableStreamController, r2), e2._backpressure && Nt(e2, false);
      }
      function Nt(e2, r2) {
        void 0 !== e2._backpressureChangePromise && e2._backpressureChangePromise_resolve(), e2._backpressureChangePromise = c(function(r3) {
          e2._backpressureChangePromise_resolve = r3;
        }), e2._backpressure = r2;
      }
      Object.defineProperties(Mt.prototype, { readable: { enumerable: true }, writable: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(Mt.prototype, r.toStringTag, { value: "TransformStream", configurable: true });
      var Ht = function() {
        function TransformStreamDefaultController() {
          throw new TypeError("Illegal constructor");
        }
        return Object.defineProperty(TransformStreamDefaultController.prototype, "desiredSize", { get: function() {
          if (!Vt(this))
            throw Jt("desiredSize");
          return lt(this._controlledTransformStream._readable._readableStreamController);
        }, enumerable: false, configurable: true }), TransformStreamDefaultController.prototype.enqueue = function(e2) {
          if (void 0 === e2 && (e2 = void 0), !Vt(this))
            throw Jt("enqueue");
          Gt(this, e2);
        }, TransformStreamDefaultController.prototype.error = function(e2) {
          if (void 0 === e2 && (e2 = void 0), !Vt(this))
            throw Jt("error");
          var r2;
          r2 = e2, Yt(this._controlledTransformStream, r2);
        }, TransformStreamDefaultController.prototype.terminate = function() {
          if (!Vt(this))
            throw Jt("terminate");
          !function(e2) {
            var r2 = e2._controlledTransformStream;
            nt(r2._readable._readableStreamController);
            var t2 = new TypeError("TransformStream terminated");
            xt(r2, t2);
          }(this);
        }, TransformStreamDefaultController;
      }();
      function Vt(e2) {
        return !!n(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_controlledTransformStream") && e2 instanceof Ht);
      }
      function Ut(e2) {
        e2._transformAlgorithm = void 0, e2._flushAlgorithm = void 0;
      }
      function Gt(e2, r2) {
        var t2 = e2._controlledTransformStream, o2 = t2._readable._readableStreamController;
        if (!ut(o2))
          throw new TypeError("Readable side is not in a state that permits enqueue");
        try {
          at(o2, r2);
        } catch (e3) {
          throw xt(t2, e3), t2._readable._storedError;
        }
        (function(e3) {
          return !tt(e3);
        })(o2) !== t2._backpressure && Nt(t2, true);
      }
      function Xt(e2, r2) {
        return m(e2._transformAlgorithm(r2), void 0, function(r3) {
          throw Yt(e2._controlledTransformStream, r3), r3;
        });
      }
      function Jt(e2) {
        return new TypeError("TransformStreamDefaultController.prototype." + e2 + " can only be used on a TransformStreamDefaultController");
      }
      function Kt(e2) {
        return new TypeError("TransformStream.prototype." + e2 + " can only be used on a TransformStream");
      }
      Object.defineProperties(Ht.prototype, { enqueue: { enumerable: true }, error: { enumerable: true }, terminate: { enumerable: true }, desiredSize: { enumerable: true } }), "symbol" == typeof r.toStringTag && Object.defineProperty(Ht.prototype, r.toStringTag, { value: "TransformStreamDefaultController", configurable: true });
      var Zt = { ReadableStream: yt, ReadableStreamDefaultController: $r, ReadableByteStreamController: he, ReadableStreamBYOBRequest: _e, ReadableStreamDefaultReader: $, ReadableStreamBYOBReader: Ve, WritableStream: ir, WritableStreamDefaultController: qr, WritableStreamDefaultWriter: vr, ByteLengthQueuingStrategy: Wt, CountQueuingStrategy: At, TransformStream: Mt, TransformStreamDefaultController: Ht };
      if (void 0 !== o)
        for (var $t in Zt)
          Object.prototype.hasOwnProperty.call(Zt, $t) && Object.defineProperty(o, $t, { value: Zt[$t], writable: true, configurable: true });
      e.ByteLengthQueuingStrategy = Wt, e.CountQueuingStrategy = At, e.ReadableByteStreamController = he, e.ReadableStream = yt, e.ReadableStreamBYOBReader = Ve, e.ReadableStreamBYOBRequest = _e, e.ReadableStreamDefaultController = $r, e.ReadableStreamDefaultReader = $, e.TransformStream = Mt, e.TransformStreamDefaultController = Ht, e.WritableStream = ir, e.WritableStreamDefaultController = qr, e.WritableStreamDefaultWriter = vr, Object.defineProperty(e, "__esModule", { value: true });
    });
  }
});

// ../../node_modules/.pnpm/abortcontroller-polyfill@1.7.5/node_modules/abortcontroller-polyfill/dist/abortcontroller.js
var require_abortcontroller = __commonJS({
  "../../node_modules/.pnpm/abortcontroller-polyfill@1.7.5/node_modules/abortcontroller-polyfill/dist/abortcontroller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        _defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        _defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", {
        writable: false
      });
      return Constructor;
    }
    function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
      }
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          writable: true,
          configurable: true
        }
      });
      Object.defineProperty(subClass, "prototype", {
        writable: false
      });
      if (superClass)
        _setPrototypeOf(subClass, superClass);
    }
    function _getPrototypeOf(o) {
      _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf2(o2) {
        return o2.__proto__ || Object.getPrototypeOf(o2);
      };
      return _getPrototypeOf(o);
    }
    function _setPrototypeOf(o, p) {
      _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf2(o2, p2) {
        o2.__proto__ = p2;
        return o2;
      };
      return _setPrototypeOf(o, p);
    }
    function _isNativeReflectConstruct() {
      if (typeof Reflect === "undefined" || !Reflect.construct)
        return false;
      if (Reflect.construct.sham)
        return false;
      if (typeof Proxy === "function")
        return true;
      try {
        Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
        }));
        return true;
      } catch (e) {
        return false;
      }
    }
    function _assertThisInitialized(self2) {
      if (self2 === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }
      return self2;
    }
    function _possibleConstructorReturn(self2, call) {
      if (call && (typeof call === "object" || typeof call === "function")) {
        return call;
      } else if (call !== void 0) {
        throw new TypeError("Derived constructors may only return object or undefined");
      }
      return _assertThisInitialized(self2);
    }
    function _createSuper(Derived) {
      var hasNativeReflectConstruct = _isNativeReflectConstruct();
      return function _createSuperInternal() {
        var Super = _getPrototypeOf(Derived), result;
        if (hasNativeReflectConstruct) {
          var NewTarget = _getPrototypeOf(this).constructor;
          result = Reflect.construct(Super, arguments, NewTarget);
        } else {
          result = Super.apply(this, arguments);
        }
        return _possibleConstructorReturn(this, result);
      };
    }
    function _superPropBase(object, property) {
      while (!Object.prototype.hasOwnProperty.call(object, property)) {
        object = _getPrototypeOf(object);
        if (object === null)
          break;
      }
      return object;
    }
    function _get() {
      if (typeof Reflect !== "undefined" && Reflect.get) {
        _get = Reflect.get.bind();
      } else {
        _get = function _get2(target, property, receiver) {
          var base = _superPropBase(target, property);
          if (!base)
            return;
          var desc = Object.getOwnPropertyDescriptor(base, property);
          if (desc.get) {
            return desc.get.call(arguments.length < 3 ? target : receiver);
          }
          return desc.value;
        };
      }
      return _get.apply(this, arguments);
    }
    var Emitter = /* @__PURE__ */ function() {
      function Emitter2() {
        _classCallCheck(this, Emitter2);
        Object.defineProperty(this, "listeners", {
          value: {},
          writable: true,
          configurable: true
        });
      }
      _createClass(Emitter2, [{
        key: "addEventListener",
        value: function addEventListener(type, callback, options) {
          if (!(type in this.listeners)) {
            this.listeners[type] = [];
          }
          this.listeners[type].push({
            callback,
            options
          });
        }
      }, {
        key: "removeEventListener",
        value: function removeEventListener(type, callback) {
          if (!(type in this.listeners)) {
            return;
          }
          var stack = this.listeners[type];
          for (var i = 0, l = stack.length; i < l; i++) {
            if (stack[i].callback === callback) {
              stack.splice(i, 1);
              return;
            }
          }
        }
      }, {
        key: "dispatchEvent",
        value: function dispatchEvent(event) {
          if (!(event.type in this.listeners)) {
            return;
          }
          var stack = this.listeners[event.type];
          var stackToCall = stack.slice();
          for (var i = 0, l = stackToCall.length; i < l; i++) {
            var listener = stackToCall[i];
            try {
              listener.callback.call(this, event);
            } catch (e) {
              Promise.resolve().then(function() {
                throw e;
              });
            }
            if (listener.options && listener.options.once) {
              this.removeEventListener(event.type, listener.callback);
            }
          }
          return !event.defaultPrevented;
        }
      }]);
      return Emitter2;
    }();
    var AbortSignal3 = /* @__PURE__ */ function(_Emitter) {
      _inherits(AbortSignal4, _Emitter);
      var _super = _createSuper(AbortSignal4);
      function AbortSignal4() {
        var _this;
        _classCallCheck(this, AbortSignal4);
        _this = _super.call(this);
        if (!_this.listeners) {
          Emitter.call(_assertThisInitialized(_this));
        }
        Object.defineProperty(_assertThisInitialized(_this), "aborted", {
          value: false,
          writable: true,
          configurable: true
        });
        Object.defineProperty(_assertThisInitialized(_this), "onabort", {
          value: null,
          writable: true,
          configurable: true
        });
        Object.defineProperty(_assertThisInitialized(_this), "reason", {
          value: void 0,
          writable: true,
          configurable: true
        });
        return _this;
      }
      _createClass(AbortSignal4, [{
        key: "toString",
        value: function toString() {
          return "[object AbortSignal]";
        }
      }, {
        key: "dispatchEvent",
        value: function dispatchEvent(event) {
          if (event.type === "abort") {
            this.aborted = true;
            if (typeof this.onabort === "function") {
              this.onabort.call(this, event);
            }
          }
          _get(_getPrototypeOf(AbortSignal4.prototype), "dispatchEvent", this).call(this, event);
        }
      }]);
      return AbortSignal4;
    }(Emitter);
    var AbortController3 = /* @__PURE__ */ function() {
      function AbortController4() {
        _classCallCheck(this, AbortController4);
        Object.defineProperty(this, "signal", {
          value: new AbortSignal3(),
          writable: true,
          configurable: true
        });
      }
      _createClass(AbortController4, [{
        key: "abort",
        value: function abort(reason) {
          var event;
          try {
            event = new Event("abort");
          } catch (e) {
            if (typeof document !== "undefined") {
              if (!document.createEvent) {
                event = document.createEventObject();
                event.type = "abort";
              } else {
                event = document.createEvent("Event");
                event.initEvent("abort", false, false);
              }
            } else {
              event = {
                type: "abort",
                bubbles: false,
                cancelable: false
              };
            }
          }
          var signalReason = reason;
          if (signalReason === void 0) {
            if (typeof document === "undefined") {
              signalReason = new Error("This operation was aborted");
              signalReason.name = "AbortError";
            } else {
              try {
                signalReason = new DOMException("signal is aborted without reason");
              } catch (err) {
                signalReason = new Error("This operation was aborted");
                signalReason.name = "AbortError";
              }
            }
          }
          this.signal.reason = signalReason;
          this.signal.dispatchEvent(event);
        }
      }, {
        key: "toString",
        value: function toString() {
          return "[object AbortController]";
        }
      }]);
      return AbortController4;
    }();
    if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
      AbortController3.prototype[Symbol.toStringTag] = "AbortController";
      AbortSignal3.prototype[Symbol.toStringTag] = "AbortSignal";
    }
    exports.AbortController = AbortController3;
    exports.AbortSignal = AbortSignal3;
    exports["default"] = AbortController3;
  }
});

// src/runtime/encoding/TextEncoder.ts
((globalThis2) => {
  globalThis2.TextEncoder = class {
    constructor() {
      this.encoding = "utf-8";
    }
    encodeInto(source, destination) {
      throw new Error("Not implemented");
    }
    encode(input = "") {
      let pos = 0;
      const len = input.length;
      let at = 0;
      let tlen = Math.max(32, len + (len >> 1) + 7);
      let target = new Uint8Array(tlen >> 3 << 3);
      while (pos < len) {
        let value = input.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319) {
          if (pos < len) {
            const extra = input.charCodeAt(pos);
            if ((extra & 64512) === 56320) {
              ++pos;
              value = ((value & 1023) << 10) + (extra & 1023) + 65536;
            }
          }
          if (value >= 55296 && value <= 56319) {
            continue;
          }
        }
        if (at + 4 > target.length) {
          tlen += 8;
          tlen *= 1 + pos / input.length * 2;
          tlen = tlen >> 3 << 3;
          const update = new Uint8Array(tlen);
          update.set(target);
          target = update;
        }
        if ((value & 4294967168) === 0) {
          target[at++] = value;
          continue;
        } else if ((value & 4294965248) === 0) {
          target[at++] = value >> 6 & 31 | 192;
        } else if ((value & 4294901760) === 0) {
          target[at++] = value >> 12 & 15 | 224;
          target[at++] = value >> 6 & 63 | 128;
        } else if ((value & 4292870144) === 0) {
          target[at++] = value >> 18 & 7 | 240;
          target[at++] = value >> 12 & 63 | 128;
          target[at++] = value >> 6 & 63 | 128;
        } else {
          continue;
        }
        target[at++] = value & 63 | 128;
      }
      return target.slice(0, at);
    }
  };
})(globalThis);

// src/runtime/encoding/TextDecoder.ts
((globalThis2) => {
  globalThis2.TextDecoder = class {
    constructor() {
      this.encoding = "utf-8";
      this.fatal = true;
      this.ignoreBOM = true;
    }
    decode(input) {
      const bytes = new Uint8Array(input);
      let pos = 0;
      const len = bytes.length;
      const out = [];
      while (pos < len) {
        const byte1 = bytes[pos++];
        if (byte1 === 0) {
          break;
        }
        if ((byte1 & 128) === 0) {
          out.push(byte1);
        } else if ((byte1 & 224) === 192) {
          const byte2 = bytes[pos++] & 63;
          out.push((byte1 & 31) << 6 | byte2);
        } else if ((byte1 & 240) === 224) {
          const byte2 = bytes[pos++] & 63;
          const byte3 = bytes[pos++] & 63;
          out.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
        } else if ((byte1 & 248) === 240) {
          const byte2 = bytes[pos++] & 63;
          const byte3 = bytes[pos++] & 63;
          const byte4 = bytes[pos++] & 63;
          let codepoint = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
          if (codepoint > 65535) {
            codepoint -= 65536;
            out.push(codepoint >>> 10 & 1023 | 55296);
            codepoint = 56320 | codepoint & 1023;
          }
          out.push(codepoint);
        } else {
        }
      }
      return String.fromCharCode.apply(null, out);
    }
  };
})(globalThis);

// src/runtime/encoding/base64.ts
((globalThis2) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  globalThis2.atob = (data) => {
    const str = String(data).replace(/[=]+$/, "");
    if (str.length % 4 === 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    let output = "";
    let bs = 0;
    for (let bc = 0, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
      buffer = chars.indexOf(buffer);
    }
    return output;
  };
  globalThis2.btoa = (data) => {
    const str = String(data);
    let output = "";
    let block = 0;
    for (let charCode, idx = 0, map = chars; str.charAt(idx | 0) || (map = "=", idx % 1); output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
      charCode = str.charCodeAt(idx += 3 / 4);
      if (charCode > 255) {
        throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  };
})(globalThis);

// src/runtime/core.ts
((globalThis2) => {
  const MULTIPART_FORMDATA_CONTENTYPE = "multipart/form-data";
  const CONTENT_DISPOSITION = "Content-Disposition";
  const APPLICATION_X_WWW_FORM_URLENCODED = "application/x-www-form-urlencoded";
  const isIterable = (value) => typeof value !== "string" && Symbol.iterator in Object(value);
  const parseMultipart = (headers, body) => {
    const formData = new FormData();
    if (!body) {
      return formData;
    }
    const contentTypeHeader = headers.get("content-type");
    if (contentTypeHeader === APPLICATION_X_WWW_FORM_URLENCODED) {
      const params = new URLSearchParams(body);
      for (const [key, value] of params) {
        formData.append(key, value);
      }
      return formData;
    } else if (contentTypeHeader?.startsWith(MULTIPART_FORMDATA_CONTENTYPE)) {
      let boundary;
      const getBoundary = (header) => header?.split(";")?.[1]?.split("=")?.[1];
      if (Array.isArray(contentTypeHeader)) {
        contentTypeHeader.forEach((header) => {
          if (!boundary) {
            boundary = getBoundary(header);
          }
        });
      } else {
        boundary = getBoundary(contentTypeHeader);
      }
      if (!boundary) {
        return formData;
      }
      for (const part of body.split(boundary)) {
        if (part?.includes(CONTENT_DISPOSITION)) {
          const content = part.split('; name="')?.[1].split("\n\n");
          if (content) {
            const [name, value] = content;
            formData.append(name.split('"')[0], value.replace("\n--", ""));
          }
        }
      }
      return formData;
    } else {
      throw new Error(`Unsupported content type: ${contentTypeHeader}`);
    }
  };
  const TEXT_ENCODER = new TextEncoder();
  const TEXT_DECODER = new TextDecoder();
  globalThis2.__lagon__ = {
    isIterable,
    parseMultipart,
    TEXT_ENCODER,
    TEXT_DECODER
  };
})(globalThis);

// src/runtime/event.ts
((globalThis2) => {
  var _a;
  globalThis2.EventTarget = class {
    constructor() {
      this.listeners = /* @__PURE__ */ new Map();
    }
    addEventListener(type, callback, options) {
      if (typeof options === "object" && options?.signal === null) {
        throw new TypeError("signal is null");
      }
      const listeners = this.listeners.get(type) ?? [];
      const exists = listeners.find((current) => current.callback === callback);
      if (!exists) {
        this.listeners.set(
          type,
          listeners.concat({
            callback,
            options
          })
        );
      }
    }
    dispatchEvent(event) {
      const { type, cancelable } = event;
      for (const { callback, options } of this.listeners.get(type) ?? []) {
        const initialPreventDefault = event.preventDefault;
        const passive = typeof options === "object" && !!options.passive;
        if (passive) {
          event.preventDefault = () => {
          };
        }
        if (typeof options === "object" && (options.once || options.signal?.aborted)) {
          this.removeEventListener(type, callback, options);
          if (options.signal?.aborted) {
            continue;
          }
        }
        if (typeof callback === "function") {
          callback(event);
        } else {
          callback?.handleEvent(event);
        }
        if (passive) {
          event.preventDefault = initialPreventDefault;
        }
        if (cancelable && event.defaultPrevented && !passive) {
          return false;
        }
      }
      return true;
    }
    removeEventListener(type, callback, options) {
      const listeners = this.listeners.get(type) ?? [];
      this.listeners.set(
        type,
        listeners.filter((listener) => listener.callback !== callback && listener.options !== options)
      );
    }
  };
  globalThis2.Event = (_a = class {
    constructor(type, eventInitDict) {
      if (type === void 0) {
        throw new TypeError("Event requires at least one argument");
      }
      this.type = type;
      this.bubbles = eventInitDict?.bubbles ?? false;
      this.cancelable = eventInitDict?.cancelable ?? false;
      this.composed = eventInitDict?.composed ?? false;
      this.cancelBubble = false;
      this.currentTarget = null;
      this.defaultPrevented = false;
      this.eventPhase = 0;
      this.isTrusted = false;
      this.returnValue = true;
      this.srcElement = null;
      this.target = null;
      this.timeStamp = Date.now();
    }
    composedPath() {
      return [];
    }
    initEvent(type, bubbles, cancelable) {
      this.type = type;
      this.bubbles = bubbles ?? false;
      this.cancelable = cancelable ?? false;
    }
    preventDefault() {
      this.defaultPrevented = true;
    }
    stopImmediatePropagation() {
    }
    stopPropagation() {
    }
  }, _a.NONE = 0, _a.CAPTURING_PHASE = 1, _a.BUBBLING_PHASE = 3, _a);
  globalThis2.CustomEvent = class extends Event {
    constructor(type, eventInitDict) {
      super(type, eventInitDict);
      this.detail = eventInitDict?.detail ?? null;
    }
    initCustomEvent(type, bubbles, cancelable, detail) {
      this.initEvent(type, bubbles, cancelable);
      this.detail = detail ?? null;
    }
  };
})(globalThis);

// src/runtime/streams.ts
var import_web_streams_polyfill = __toESM(require_polyfill_min(), 1);
((globalThis2) => {
  globalThis2.ReadableStream = import_web_streams_polyfill.ReadableStream;
  globalThis2.ReadableStreamBYOBReader = import_web_streams_polyfill.ReadableStreamBYOBReader;
  globalThis2.ReadableStreamDefaultReader = import_web_streams_polyfill.ReadableStreamDefaultReader;
  globalThis2.TransformStream = import_web_streams_polyfill.TransformStream;
  globalThis2.WritableStream = import_web_streams_polyfill.WritableStream;
  globalThis2.WritableStreamDefaultWriter = import_web_streams_polyfill.WritableStreamDefaultWriter;
})(globalThis);

// src/runtime/abort.ts
var import_abortcontroller = __toESM(require_abortcontroller(), 1);
((globalThis2) => {
  globalThis2.AbortController = import_abortcontroller.AbortController;
  globalThis2.AbortSignal = import_abortcontroller.AbortSignal;
})(globalThis);

// src/runtime/blob.ts
((globalThis2) => {
  globalThis2.Blob = class {
    constructor(blobParts, options) {
      if (blobParts) {
        const chunks = blobParts.map((blobPart) => {
          if (typeof blobPart === "string") {
            return globalThis2.__lagon__.TEXT_ENCODER.encode(blobPart);
          } else if (blobPart instanceof ArrayBuffer || blobPart instanceof Uint8Array) {
            return new Uint8Array(blobPart);
          } else if (blobPart instanceof Blob) {
            return blobPart.buffer;
          } else {
            return new Uint8Array(0);
          }
        });
        const totalSize = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
        const buffer = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of chunks) {
          buffer.set(chunk, offset);
          offset += chunk.byteLength;
        }
        this.size = buffer.byteLength;
        this.buffer = buffer;
      } else {
        this.size = 0;
        this.buffer = new Uint8Array(0);
      }
      this.type = options?.type || "";
    }
    arrayBuffer() {
      return Promise.resolve(this.buffer.buffer);
    }
    slice(start, end, contentType) {
      let type = contentType;
      if (type === void 0) {
        type = this.type;
      } else if (type === null) {
        type = "null";
      }
      return new Blob([this.buffer.slice(start, end)], { type });
    }
    stream() {
      return new ReadableStream({
        pull: async (controller) => {
          controller.enqueue(this.buffer);
          controller.close();
        }
      });
    }
    text() {
      return Promise.resolve(globalThis2.__lagon__.TEXT_DECODER.decode(this.buffer));
    }
  };
})(globalThis);

// src/runtime/file.ts
((globalThis2) => {
  globalThis2.File = class extends Blob {
    constructor(fileBits, fileName, options) {
      super(fileBits, options);
      this.lastModified = options?.lastModified || Date.now();
      this.name = fileName;
      this.webkitRelativePath = "";
    }
  };
  globalThis2.FileReader = class {
    constructor() {
    }
    onerror() {
    }
    onload() {
    }
    readAsText(blob, encoding) {
      blob.text().then((text) => {
        this.result = text;
        this.onload(this);
      });
    }
  };
})(globalThis);

// src/runtime/global/console.ts
((globalThis2) => {
  const inspect = (input) => {
    if (typeof input === "string") {
      return input;
    } else if (typeof input === "number" || typeof input === "boolean") {
      return String(input);
    } else if (typeof input === "function") {
      return "[Function]";
    } else if (input === void 0 || input === null) {
      return input === void 0 ? "undefined" : "null";
    } else {
      const result = JSON.stringify(input);
      if (result === "{}" && typeof input === "object" && "toString" in input) {
        return input.toString();
      }
      return result;
    }
  };
  const format = (input, ...args) => {
    const result = [];
    if (typeof input !== "string") {
      result.push(inspect(input));
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        result.push(inspect(arg));
      }
    } else {
      let i = 0;
      result.push(
        input.replace(/%[sdifjoOc%]/g, (match) => {
          const arg = args[i++];
          if (!arg) {
            return match;
          }
          switch (match) {
            case "%s":
              return String(arg);
            case "%d":
              return String(Number(arg));
            case "%i":
              return String(parseInt(arg, 10));
            case "%f":
              return String(parseFloat(arg));
            case "%j":
            case "%o":
            case "%O":
              return JSON.stringify(arg);
            case "%%":
              return "%";
            case "%c":
            default:
              return match;
          }
        })
      );
      for (let j = i; j < args.length; j++) {
        const arg = args[j];
        result.push(inspect(arg));
      }
    }
    return result.join(" ");
  };
  const types = ["log", "info", "debug", "error", "warn"];
  types.forEach((type) => {
    globalThis2.console[type] = (input, ...args) => {
      Lagon.log(type, format(input, ...args));
    };
  });
})(globalThis);

// src/runtime/global/process.ts
((globalThis2) => {
  globalThis2.process = {
    ...globalThis2.process,
    env: {},
    argv: []
  };
})(globalThis);

// src/runtime/global/crypto.ts
((globalThis2) => {
  const getRandomValues = (array) => Lagon.randomValues(array);
  const randomUUID = () => Lagon.uuid();
  const SYMMETRIC_ALGORITHMS = ["HMAC", "AES-CBC", "AES-CTR", "AES-GCM", "AES-KW"];
  globalThis2.CryptoKey = class {
    constructor(algorithm, extractable, type, usages) {
      this.algorithm = algorithm;
      this.extractable = extractable;
      this.type = type;
      this.usages = usages;
      this.keyValue = Lagon.getKeyValue();
    }
  };
  class SubtleCrypto {
    async decrypt(algorithm, key, data) {
      return Lagon.decrypt(algorithm, key, data);
    }
    async deriveBits(algorithm, baseKey, length) {
      throw new Error("Not implemented");
    }
    async deriveKey(algorithm, baseKey, derivedKeyType, extractable, keyUsages) {
      throw new Error("Not implemented");
    }
    async digest(algorithm, data) {
      return Lagon.digest(algorithm, data);
    }
    async encrypt(algorithm, key, data) {
      return Lagon.encrypt(algorithm, key, data);
    }
    async exportKey(format, key) {
      if (!key.extractable) {
        throw new TypeError("Key is not extractable");
      }
      if (format === "jwk") {
        throw new Error("jwk format is not supported");
      }
      return key.keyValue;
    }
    async generateKey(algorithm, extractable, keyUsages) {
      let isSymmetric;
      if (typeof algorithm === "string") {
        isSymmetric = SYMMETRIC_ALGORITHMS.includes(algorithm);
      } else {
        isSymmetric = SYMMETRIC_ALGORITHMS.includes(algorithm.name);
      }
      if (isSymmetric) {
        return new CryptoKey(algorithm, extractable, "secret", keyUsages);
      } else {
        return {
          privateKey: new CryptoKey(algorithm, extractable, "private", keyUsages),
          publicKey: new CryptoKey(algorithm, extractable, "public", keyUsages)
        };
      }
    }
    async importKey(format, keyData, algorithm, extractable, keyUsages) {
      return new CryptoKey(algorithm, extractable, "secret", keyUsages);
    }
    async sign(algorithm, key, data) {
      return Lagon.sign(algorithm, key, data);
    }
    async unwrapKey(format, wrappedKey, unwrappingKey, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, keyUsages) {
      const content = await this.decrypt(unwrapAlgorithm, unwrappingKey, wrappedKey);
      return this.importKey(
        format,
        content,
        unwrappedKeyAlgorithm,
        extractable,
        keyUsages
      );
    }
    async verify(algorithm, key, signature, data) {
      return Lagon.verify(algorithm, key, signature, data);
    }
    async wrapKey(format, key, wrappingKey, wrapAlgorithm) {
      const content = await this.exportKey(format, key);
      return this.encrypt(wrapAlgorithm, wrappingKey, content);
    }
  }
  globalThis2.crypto = {
    getRandomValues,
    randomUUID,
    subtle: new SubtleCrypto()
  };
})(globalThis);

// package.json
var version = "0.2.0";

// src/runtime/global/navigator.ts
((globalThis2) => {
  globalThis2.navigator = {
    ...globalThis2.navigator,
    userAgent: `Lagon/${version}`
  };
})(globalThis);

// src/runtime/http/URLSearchParams.ts
((globalThis2) => {
  globalThis2.URLSearchParams = class {
    constructor(init) {
      this.params = /* @__PURE__ */ new Map();
      if (init) {
        if (typeof init === "string") {
          init.replace("?", "").split("&").forEach((entry) => {
            const [key, value] = entry.split("=");
            this.addValue(key, decodeURIComponent(value));
          });
        } else if (typeof init === "object") {
          if (Array.isArray(init)) {
            init.forEach(([key, value]) => {
              this.addValue(key, value);
            });
          } else {
            Object.entries(init).forEach(([key, value]) => {
              this.addValue(key, value);
            });
          }
        }
      }
    }
    addValue(name, value) {
      const values = this.params.get(name);
      if (values) {
        values.push(value);
      } else {
        this.params.set(name, [value]);
      }
    }
    append(name, value) {
      this.addValue(name, value);
    }
    delete(name) {
      this.params.delete(name);
    }
    *entries() {
      for (const [key, values] of this.params) {
        for (const value of values) {
          yield [key, value];
        }
      }
    }
    forEach(callbackfn, thisArg) {
      this.params.forEach((values, key) => {
        values.forEach((value) => {
          callbackfn.call(thisArg, value, key, this);
        });
      });
    }
    get(name) {
      return this.params.get(name)?.[0] || null;
    }
    getAll(name) {
      return this.params.get(name) || [];
    }
    has(name) {
      return this.params.has(name);
    }
    keys() {
      return this.params.keys();
    }
    set(name, value) {
      this.params.set(name, [value]);
    }
    sort() {
      this.params = new Map([...this.params].sort());
    }
    toString() {
      return Array.from(this.params.entries()).map(([key, value]) => `${key}=${value}`).join("&");
    }
    *values() {
      for (const [, values] of this.params) {
        for (const value of values) {
          yield value;
        }
      }
    }
    [Symbol.iterator]() {
      return this.entries();
    }
  };
})(globalThis);

// src/runtime/http/URL.ts
((globalThis2) => {
  const DEFAULT_PORTS = {
    "ftp:": "21",
    "http:": "80",
    "https:": "443",
    "ws:": "80",
    "wss:": "443"
  };
  globalThis2.URL = class {
    constructor(url, base) {
      this.hash = "";
      this.hostname = "";
      this.origin = "";
      this.password = "";
      this.pathname = "";
      this.port = "";
      this.protocol = "";
      this.username = "";
      this.initialize(url, base);
    }
    initialize(url, base) {
      let finalUrl = url.toString();
      if (base) {
        const baseUrl = new URL(base);
        finalUrl = baseUrl.protocol + "//" + baseUrl.host;
        if (!url.toString().startsWith("/")) {
          finalUrl += "/";
        }
        finalUrl += url;
      }
      const result = /((?:blob|file):)?(https?\:)\/\/(?:(.*):(.*)@)?([^:\/?#]*)(?:\:([0-9]+))?([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/.exec(
        finalUrl
      );
      if (result) {
        const [_href, origin, protocol, username, password, hostname, port, pathname, search, hash] = result;
        this.hash = hash;
        this.hostname = hostname;
        this.port = port === DEFAULT_PORTS[protocol] ? "" : port;
        if (["http:", "https:"].includes(protocol) || ["blob:", "file:"].includes(origin)) {
          this.origin = protocol + "//" + hostname;
          if (this.port) {
            this.origin += ":" + this.port;
          }
        }
        this.password = password || "";
        this.pathname = pathname === "" ? "/" : pathname;
        this.protocol = protocol;
        this.searchParams = new URLSearchParams(search);
        this.username = username || "";
      } else {
        this.searchParams = new URLSearchParams();
      }
    }
    static createObjectURL(obj) {
      throw new Error("Not implemented");
    }
    static revokeObjectURL(url) {
      throw new Error("Not implemented");
    }
    get href() {
      const credentials = this.username + (this.password ? ":" + this.password : "");
      let href = this.protocol + "//" + (credentials ? credentials + "@" : "") + this.host + this.pathname + this.search + this.hash;
      if (this.protocol === "file:") {
        href = href.replace("//", "");
      }
      return href;
    }
    set href(href) {
      this.initialize(href);
    }
    get host() {
      return this.hostname + (this.port ? ":" + this.port : "");
    }
    set host(host) {
      const result = /^([^:\/?#]*)(?:\:([0-9]+))$/.exec(host);
      if (result) {
        const [, hostname, port] = result;
        this.hostname = hostname;
        this.port = port;
      } else {
        this.hostname = host;
        this.port = "";
      }
    }
    get search() {
      const search = this.searchParams.toString();
      return search ? "?" + search : "";
    }
    set search(search) {
      const newSearchParams = new URLSearchParams(search);
      for (const key of this.searchParams.keys()) {
        this.searchParams.delete(key);
      }
      for (const [key, value] of newSearchParams) {
        this.searchParams.append(key, value);
      }
    }
    toString() {
      return this.href;
    }
    toJSON() {
      return this.toString();
    }
  };
})(globalThis);

// src/runtime/http/Headers.ts
((globalThis2) => {
  globalThis2.Headers = class {
    constructor(init) {
      this.h = /* @__PURE__ */ new Map();
      this.immutable = false;
      if (init === null) {
        throw new TypeError("HeadersInit must not be null");
      }
      if (init) {
        if (Array.isArray(init)) {
          init.forEach((entry) => {
            if (entry.length !== 2) {
              throw new TypeError("HeadersInit must be an array of 2-tuples");
            }
            this.addValue(entry[0], entry[1]);
          });
        } else {
          if (init instanceof Headers) {
            for (const [key, value] of init) {
              this.addValue(key, value);
            }
            return;
          }
          if (typeof init !== "object") {
            throw new TypeError("HeadersInit must be an object or an array of 2-tuples");
          }
          Object.entries(init).forEach(([key, value]) => {
            this.addValue(key, value);
          });
        }
      }
    }
    addValue(name, value) {
      name = name.toLowerCase();
      value = String(value);
      const values = this.h.get(name);
      if (values) {
        values.push(value);
      } else {
        this.h.set(name, [value]);
      }
    }
    append(name, value) {
      if (this.immutable) {
        throw new TypeError("Headers are immutable");
      }
      name = name.toLowerCase();
      this.addValue(name, value);
    }
    delete(name) {
      if (this.immutable) {
        throw new TypeError("Headers are immutable");
      }
      name = name.toLowerCase();
      this.h.delete(name);
    }
    *entries() {
      const sorted = [...this.h.entries()].sort(([a], [b]) => a.localeCompare(b));
      for (const [key, values] of sorted) {
        yield [key, values.join(", ")];
      }
    }
    get(name) {
      name = name.toLowerCase();
      return this.h.get(name)?.join(", ") || null;
    }
    has(name) {
      name = name.toLowerCase();
      return this.h.has(name);
    }
    keys() {
      return this.h.keys();
    }
    set(name, value) {
      if (this.immutable) {
        throw new TypeError("Headers are immutable");
      }
      name = name.toLowerCase();
      value = String(value);
      this.h.set(name, [value]);
    }
    *values() {
      for (const [, values] of this.h) {
        for (const value of values) {
          yield value;
        }
      }
    }
    forEach(callbackfn, thisArg) {
      for (const [key, value] of this.entries()) {
        callbackfn.call(thisArg, value, key, this);
      }
    }
    [Symbol.iterator]() {
      return this.entries();
    }
  };
})(globalThis);

// src/runtime/http/FormData.ts
((globalThis2) => {
  globalThis2.FormData = class {
    constructor() {
      this.fields = /* @__PURE__ */ new Map();
    }
    addValue(name, value) {
      const values = this.fields.get(name);
      if (values) {
        values.push(value);
      } else {
        this.fields.set(name, [value]);
      }
    }
    append(name, value) {
      this.addValue(name, value);
    }
    delete(name) {
      this.fields.delete(name);
    }
    *entries() {
      for (const [key, values] of this.fields) {
        for (const value of values) {
          yield [key, value];
        }
      }
    }
    forEach(callbackfn, thisArg) {
      this.fields.forEach((values, key) => {
        values.forEach((value) => {
          callbackfn.call(thisArg, value, key, this);
        });
      });
    }
    get(name) {
      return this.fields.get(name)?.[0] || null;
    }
    getAll(name) {
      return this.fields.get(name) || [];
    }
    has(name) {
      return this.fields.has(name);
    }
    keys() {
      return this.fields.keys();
    }
    set(name, value) {
      this.fields.set(name, [value]);
    }
    *values() {
      for (const [, values] of this.fields) {
        for (const value of values) {
          yield value;
        }
      }
    }
    [Symbol.iterator]() {
      return this.entries();
    }
  };
})(globalThis);

// src/runtime/http/body.ts
var RequestResponseBody = class {
  constructor(body = null, headersInit) {
    if (body !== null) {
      if (body instanceof ReadableStream || typeof body === "string") {
        this.body = body;
        this.bodyUsed = false;
        this.headersInit = headersInit;
        this.isStream = body instanceof ReadableStream;
        return;
      }
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      if (typeof body === "string") {
        writer.write(globalThis.__lagon__.TEXT_ENCODER.encode(body));
      } else {
        writer.write(body);
      }
      writer.close();
      this.body = stream.readable;
    } else {
      this.body = null;
    }
    this.bodyUsed = false;
    this.headersInit = headersInit;
    this.isStream = false;
    if (body instanceof URLSearchParams) {
      this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
    }
  }
  get headers() {
    if (this.headersCache) {
      return this.headersCache;
    }
    if (this.headersInit) {
      if (this.headersInit instanceof Headers) {
        this.headersCache = this.headersInit;
      } else {
        this.headersCache = new Headers(this.headersInit);
      }
    } else {
      this.headersCache = new Headers();
    }
    return this.headersCache;
  }
  async arrayBuffer() {
    return this.text().then((text) => globalThis.__lagon__.TEXT_ENCODER.encode(text));
  }
  async blob() {
    const type = this.headers.get("content-type") || void 0;
    return this.arrayBuffer().then((buffer) => new Blob([buffer], { type }));
  }
  async formData() {
    const body = await this.text();
    return globalThis.__lagon__.parseMultipart(this.headers, body);
  }
  async json() {
    return this.text().then((text) => JSON.parse(text));
  }
  async text() {
    if (this.bodyUsed) {
      throw new TypeError("Body is already used");
    }
    if (!this.body) {
      this.bodyUsed = true;
      return "";
    }
    if (typeof this.body === "string") {
      this.bodyUsed = true;
      return this.body;
    }
    return new Promise((resolve) => {
      const reader = this.body.getReader();
      let result = "";
      const pull = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            this.bodyUsed = true;
            return resolve(result);
          }
          if (globalThis.__lagon__.isIterable(value)) {
            result += globalThis.__lagon__.TEXT_DECODER.decode(value);
          } else {
            result += value;
          }
          pull();
        });
      };
      pull();
    });
  }
};

// src/runtime/http/Response.ts
((globalThis2) => {
  const NULL_BODY_STATUS = [101, 103, 204, 205, 304];
  const REDIRECT_STATUS = [301, 302, 303, 307, 308];
  globalThis2.Response = class extends RequestResponseBody {
    constructor(body, init) {
      super(body, init?.headers);
      if (!!body && NULL_BODY_STATUS.includes(init?.status ?? 200)) {
        throw new TypeError("Response with null body status cannot have body");
      }
      if (init?.status) {
        this.ok = init.status >= 200 && init.status < 300;
      } else {
        this.ok = true;
      }
      this.status = init?.status ?? 200;
      this.statusText = init?.statusText ?? "";
      this.url = init?.url || "";
      this.type = "default";
      this.redirected = false;
    }
    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      });
    }
    static error() {
      const response = new Response(null, {
        status: 0
      });
      response.type = "error";
      response.headers.immutable = true;
      return response;
    }
    static redirect(url, status = 302) {
      if (!REDIRECT_STATUS.includes(status)) {
        throw new RangeError("Invalid status code");
      }
      const response = new Response(null, {
        status,
        headers: {
          Location: new URL(url).toString()
        }
      });
      response.type = "default";
      return response;
    }
    static json(data, init) {
      const body = JSON.stringify(data);
      if (body === void 0) {
        throw new TypeError("The data is not serializable");
      }
      const headers = new Headers(init?.headers);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
      return new Response(body, {
        ...init,
        headers
      });
    }
  };
})(globalThis);

// src/runtime/http/Request.ts
((globalThis2) => {
  globalThis2.Request = class extends RequestResponseBody {
    constructor(input, init) {
      super(init?.body, init?.headers);
      this.init = init;
      this.method = init?.method || "GET";
      this.url = input.toString();
      this.cache = init?.cache || "default";
      this.credentials = init?.credentials || "same-origin";
      this.destination = "worker";
      this.integrity = init?.integrity || "";
      this.keepalive = init?.keepalive || false;
      this.mode = init?.mode || "cors";
      this.redirect = init?.redirect || "follow";
      this.referrer = init?.referrer || "";
      this.referrerPolicy = init?.referrerPolicy || "";
    }
    get signal() {
      return this.init?.signal || new AbortSignal();
    }
    clone() {
      return new Request(this.url, {
        method: this.method,
        body: this.body,
        headers: this.headers
      });
    }
  };
})(globalThis);

// src/runtime/http/fetch.ts
((globalThis2) => {
  const isHeadersObject = (headers) => !!headers && "entries" in headers;
  globalThis2.fetch = async (input, init) => {
    let headers = void 0;
    if (isHeadersObject(init?.headers)) {
      headers = /* @__PURE__ */ new Map();
      for (const [key, value] of (init?.headers).entries()) {
        headers.set(key, value);
      }
    } else if (init?.headers) {
      headers = new Map(Object.entries(init.headers));
    }
    let body;
    if (init?.body) {
      if (globalThis2.__lagon__.isIterable(init.body)) {
        body = globalThis2.__lagon__.TEXT_DECODER.decode(init.body);
      } else {
        if (typeof init.body !== "string") {
          throw new Error("Body must be a string or an iterable");
        }
        body = init.body;
      }
    }
    const checkAborted = () => {
      if (init?.signal?.aborted) {
        throw new Error("Aborted");
      }
    };
    try {
      checkAborted();
      const response = await Lagon.fetch({
        m: init?.method || "GET",
        u: input.toString(),
        b: body,
        h: headers
      });
      checkAborted();
      return new Response(response.b, {
        headers: response.h,
        status: response.s
      });
    } catch (error) {
      if (typeof error === "string") {
        throw new Error(error);
      }
      throw error;
    }
  };
})(globalThis);

// src/index.ts
async function masterHandler(request) {
  if (typeof handler !== "function") {
    throw new Error("Handler function is not defined or is not a function");
  }
  const handlerRequest = new Request(request.i, {
    method: request.m,
    headers: request.h,
    body: request.b
  });
  const response = await handler(handlerRequest);
  if (response.body && response.isStream) {
    const reader = response.body.getReader();
    new ReadableStream({
      start: (controller) => {
        const push = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              Lagon.pullStream(done);
              return;
            }
            controller.enqueue(value);
            Lagon.pullStream(done, value);
            push();
          });
        };
        push();
      }
    });
  } else {
    response.body = await response.text();
  }
  return {
    b: response.body,
    h: response.headers,
    s: response.status
  };
}
export {
  masterHandler
};
