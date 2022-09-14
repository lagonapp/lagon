/* eslint-disable no-var */
import {
  ReadableStream as RS,
  ReadableStreamBYOBReader as RSBYOBR,
  ReadableStreamDefaultReader as RSDR,
  TransformStream as TS,
  WritableStream as WS,
  WritableStreamDefaultWriter as WSDW,
} from 'web-streams-polyfill';

var ReadableStream = RS;
var ReadableStreamBYOBReader = RSBYOBR;
var ReadableStreamDefaultReader = RSDR;
var TransformStream = TS;
var WritableStream = WS;
var WritableStreamDefaultWriter = WSDW;

export {
  ReadableStream,
  ReadableStreamBYOBReader,
  ReadableStreamDefaultReader,
  TransformStream,
  WritableStream,
  WritableStreamDefaultWriter,
};
