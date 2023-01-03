// ../../node_modules/.pnpm/preact@10.8.2/node_modules/preact/dist/preact.module.js
var n;
var l;
var u;
var i;
var t;
var o;
var r;
var f;
var e = {};
var c = [];
var s = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
function a(n2, l3) {
  for (var u3 in l3)
    n2[u3] = l3[u3];
  return n2;
}
function h(n2) {
  var l3 = n2.parentNode;
  l3 && l3.removeChild(n2);
}
function v(l3, u3, i3) {
  var t3, o3, r3, f3 = {};
  for (r3 in u3)
    "key" == r3 ? t3 = u3[r3] : "ref" == r3 ? o3 = u3[r3] : f3[r3] = u3[r3];
  if (arguments.length > 2 && (f3.children = arguments.length > 3 ? n.call(arguments, 2) : i3), "function" == typeof l3 && null != l3.defaultProps)
    for (r3 in l3.defaultProps)
      void 0 === f3[r3] && (f3[r3] = l3.defaultProps[r3]);
  return y(l3, f3, t3, o3, null);
}
function y(n2, i3, t3, o3, r3) {
  var f3 = { type: n2, props: i3, key: t3, ref: o3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, __h: null, constructor: void 0, __v: null == r3 ? ++u : r3 };
  return null == r3 && null != l.vnode && l.vnode(f3), f3;
}
function d(n2) {
  return n2.children;
}
function _(n2, l3) {
  this.props = n2, this.context = l3;
}
function k(n2, l3) {
  if (null == l3)
    return n2.__ ? k(n2.__, n2.__.__k.indexOf(n2) + 1) : null;
  for (var u3; l3 < n2.__k.length; l3++)
    if (null != (u3 = n2.__k[l3]) && null != u3.__e)
      return u3.__e;
  return "function" == typeof n2.type ? k(n2) : null;
}
function b(n2) {
  var l3, u3;
  if (null != (n2 = n2.__) && null != n2.__c) {
    for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++)
      if (null != (u3 = n2.__k[l3]) && null != u3.__e) {
        n2.__e = n2.__c.base = u3.__e;
        break;
      }
    return b(n2);
  }
}
function m(n2) {
  (!n2.__d && (n2.__d = true) && t.push(n2) && !g.__r++ || r !== l.debounceRendering) && ((r = l.debounceRendering) || o)(g);
}
function g() {
  for (var n2; g.__r = t.length; )
    n2 = t.sort(function(n3, l3) {
      return n3.__v.__b - l3.__v.__b;
    }), t = [], n2.some(function(n3) {
      var l3, u3, i3, t3, o3, r3;
      n3.__d && (o3 = (t3 = (l3 = n3).__v).__e, (r3 = l3.__P) && (u3 = [], (i3 = a({}, t3)).__v = t3.__v + 1, j(r3, t3, i3, l3.__n, void 0 !== r3.ownerSVGElement, null != t3.__h ? [o3] : null, u3, null == o3 ? k(t3) : o3, t3.__h), z(u3, t3), t3.__e != o3 && b(t3)));
    });
}
function w(n2, l3, u3, i3, t3, o3, r3, f3, s2, a3) {
  var h2, v3, p2, _2, b3, m3, g3, w2 = i3 && i3.__k || c, A = w2.length;
  for (u3.__k = [], h2 = 0; h2 < l3.length; h2++)
    if (null != (_2 = u3.__k[h2] = null == (_2 = l3[h2]) || "boolean" == typeof _2 ? null : "string" == typeof _2 || "number" == typeof _2 || "bigint" == typeof _2 ? y(null, _2, null, null, _2) : Array.isArray(_2) ? y(d, { children: _2 }, null, null, null) : _2.__b > 0 ? y(_2.type, _2.props, _2.key, null, _2.__v) : _2)) {
      if (_2.__ = u3, _2.__b = u3.__b + 1, null === (p2 = w2[h2]) || p2 && _2.key == p2.key && _2.type === p2.type)
        w2[h2] = void 0;
      else
        for (v3 = 0; v3 < A; v3++) {
          if ((p2 = w2[v3]) && _2.key == p2.key && _2.type === p2.type) {
            w2[v3] = void 0;
            break;
          }
          p2 = null;
        }
      j(n2, _2, p2 = p2 || e, t3, o3, r3, f3, s2, a3), b3 = _2.__e, (v3 = _2.ref) && p2.ref != v3 && (g3 || (g3 = []), p2.ref && g3.push(p2.ref, null, _2), g3.push(v3, _2.__c || b3, _2)), null != b3 ? (null == m3 && (m3 = b3), "function" == typeof _2.type && _2.__k === p2.__k ? _2.__d = s2 = x(_2, s2, n2) : s2 = P(n2, _2, p2, w2, b3, s2), "function" == typeof u3.type && (u3.__d = s2)) : s2 && p2.__e == s2 && s2.parentNode != n2 && (s2 = k(p2));
    }
  for (u3.__e = m3, h2 = A; h2--; )
    null != w2[h2] && ("function" == typeof u3.type && null != w2[h2].__e && w2[h2].__e == u3.__d && (u3.__d = k(i3, h2 + 1)), N(w2[h2], w2[h2]));
  if (g3)
    for (h2 = 0; h2 < g3.length; h2++)
      M(g3[h2], g3[++h2], g3[++h2]);
}
function x(n2, l3, u3) {
  for (var i3, t3 = n2.__k, o3 = 0; t3 && o3 < t3.length; o3++)
    (i3 = t3[o3]) && (i3.__ = n2, l3 = "function" == typeof i3.type ? x(i3, l3, u3) : P(u3, i3, i3, t3, i3.__e, l3));
  return l3;
}
function P(n2, l3, u3, i3, t3, o3) {
  var r3, f3, e3;
  if (void 0 !== l3.__d)
    r3 = l3.__d, l3.__d = void 0;
  else if (null == u3 || t3 != o3 || null == t3.parentNode)
    n:
      if (null == o3 || o3.parentNode !== n2)
        n2.appendChild(t3), r3 = null;
      else {
        for (f3 = o3, e3 = 0; (f3 = f3.nextSibling) && e3 < i3.length; e3 += 2)
          if (f3 == t3)
            break n;
        n2.insertBefore(t3, o3), r3 = o3;
      }
  return void 0 !== r3 ? r3 : t3.nextSibling;
}
function C(n2, l3, u3, i3, t3) {
  var o3;
  for (o3 in u3)
    "children" === o3 || "key" === o3 || o3 in l3 || H(n2, o3, null, u3[o3], i3);
  for (o3 in l3)
    t3 && "function" != typeof l3[o3] || "children" === o3 || "key" === o3 || "value" === o3 || "checked" === o3 || u3[o3] === l3[o3] || H(n2, o3, l3[o3], u3[o3], i3);
}
function $(n2, l3, u3) {
  "-" === l3[0] ? n2.setProperty(l3, u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || s.test(l3) ? u3 : u3 + "px";
}
function H(n2, l3, u3, i3, t3) {
  var o3;
  n:
    if ("style" === l3)
      if ("string" == typeof u3)
        n2.style.cssText = u3;
      else {
        if ("string" == typeof i3 && (n2.style.cssText = i3 = ""), i3)
          for (l3 in i3)
            u3 && l3 in u3 || $(n2.style, l3, "");
        if (u3)
          for (l3 in u3)
            i3 && u3[l3] === i3[l3] || $(n2.style, l3, u3[l3]);
      }
    else if ("o" === l3[0] && "n" === l3[1])
      o3 = l3 !== (l3 = l3.replace(/Capture$/, "")), l3 = l3.toLowerCase() in n2 ? l3.toLowerCase().slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + o3] = u3, u3 ? i3 || n2.addEventListener(l3, o3 ? T : I, o3) : n2.removeEventListener(l3, o3 ? T : I, o3);
    else if ("dangerouslySetInnerHTML" !== l3) {
      if (t3)
        l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("href" !== l3 && "list" !== l3 && "form" !== l3 && "tabIndex" !== l3 && "download" !== l3 && l3 in n2)
        try {
          n2[l3] = null == u3 ? "" : u3;
          break n;
        } catch (n3) {
        }
      "function" == typeof u3 || (null != u3 && (false !== u3 || "a" === l3[0] && "r" === l3[1]) ? n2.setAttribute(l3, u3) : n2.removeAttribute(l3));
    }
}
function I(n2) {
  this.l[n2.type + false](l.event ? l.event(n2) : n2);
}
function T(n2) {
  this.l[n2.type + true](l.event ? l.event(n2) : n2);
}
function j(n2, u3, i3, t3, o3, r3, f3, e3, c3) {
  var s2, h2, v3, y3, p2, k3, b3, m3, g3, x2, A, P2, C2, $2 = u3.type;
  if (void 0 !== u3.constructor)
    return null;
  null != i3.__h && (c3 = i3.__h, e3 = u3.__e = i3.__e, u3.__h = null, r3 = [e3]), (s2 = l.__b) && s2(u3);
  try {
    n:
      if ("function" == typeof $2) {
        if (m3 = u3.props, g3 = (s2 = $2.contextType) && t3[s2.__c], x2 = s2 ? g3 ? g3.props.value : s2.__ : t3, i3.__c ? b3 = (h2 = u3.__c = i3.__c).__ = h2.__E : ("prototype" in $2 && $2.prototype.render ? u3.__c = h2 = new $2(m3, x2) : (u3.__c = h2 = new _(m3, x2), h2.constructor = $2, h2.render = O), g3 && g3.sub(h2), h2.props = m3, h2.state || (h2.state = {}), h2.context = x2, h2.__n = t3, v3 = h2.__d = true, h2.__h = []), null == h2.__s && (h2.__s = h2.state), null != $2.getDerivedStateFromProps && (h2.__s == h2.state && (h2.__s = a({}, h2.__s)), a(h2.__s, $2.getDerivedStateFromProps(m3, h2.__s))), y3 = h2.props, p2 = h2.state, v3)
          null == $2.getDerivedStateFromProps && null != h2.componentWillMount && h2.componentWillMount(), null != h2.componentDidMount && h2.__h.push(h2.componentDidMount);
        else {
          if (null == $2.getDerivedStateFromProps && m3 !== y3 && null != h2.componentWillReceiveProps && h2.componentWillReceiveProps(m3, x2), !h2.__e && null != h2.shouldComponentUpdate && false === h2.shouldComponentUpdate(m3, h2.__s, x2) || u3.__v === i3.__v) {
            h2.props = m3, h2.state = h2.__s, u3.__v !== i3.__v && (h2.__d = false), h2.__v = u3, u3.__e = i3.__e, u3.__k = i3.__k, u3.__k.forEach(function(n3) {
              n3 && (n3.__ = u3);
            }), h2.__h.length && f3.push(h2);
            break n;
          }
          null != h2.componentWillUpdate && h2.componentWillUpdate(m3, h2.__s, x2), null != h2.componentDidUpdate && h2.__h.push(function() {
            h2.componentDidUpdate(y3, p2, k3);
          });
        }
        if (h2.context = x2, h2.props = m3, h2.__v = u3, h2.__P = n2, A = l.__r, P2 = 0, "prototype" in $2 && $2.prototype.render)
          h2.state = h2.__s, h2.__d = false, A && A(u3), s2 = h2.render(h2.props, h2.state, h2.context);
        else
          do {
            h2.__d = false, A && A(u3), s2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
          } while (h2.__d && ++P2 < 25);
        h2.state = h2.__s, null != h2.getChildContext && (t3 = a(a({}, t3), h2.getChildContext())), v3 || null == h2.getSnapshotBeforeUpdate || (k3 = h2.getSnapshotBeforeUpdate(y3, p2)), C2 = null != s2 && s2.type === d && null == s2.key ? s2.props.children : s2, w(n2, Array.isArray(C2) ? C2 : [C2], u3, i3, t3, o3, r3, f3, e3, c3), h2.base = u3.__e, u3.__h = null, h2.__h.length && f3.push(h2), b3 && (h2.__E = h2.__ = null), h2.__e = false;
      } else
        null == r3 && u3.__v === i3.__v ? (u3.__k = i3.__k, u3.__e = i3.__e) : u3.__e = L(i3.__e, u3, i3, t3, o3, r3, f3, c3);
    (s2 = l.diffed) && s2(u3);
  } catch (n3) {
    u3.__v = null, (c3 || null != r3) && (u3.__e = e3, u3.__h = !!c3, r3[r3.indexOf(e3)] = null), l.__e(n3, u3, i3);
  }
}
function z(n2, u3) {
  l.__c && l.__c(u3, n2), n2.some(function(u4) {
    try {
      n2 = u4.__h, u4.__h = [], n2.some(function(n3) {
        n3.call(u4);
      });
    } catch (n3) {
      l.__e(n3, u4.__v);
    }
  });
}
function L(l3, u3, i3, t3, o3, r3, f3, c3) {
  var s2, a3, v3, y3 = i3.props, p2 = u3.props, d3 = u3.type, _2 = 0;
  if ("svg" === d3 && (o3 = true), null != r3) {
    for (; _2 < r3.length; _2++)
      if ((s2 = r3[_2]) && "setAttribute" in s2 == !!d3 && (d3 ? s2.localName === d3 : 3 === s2.nodeType)) {
        l3 = s2, r3[_2] = null;
        break;
      }
  }
  if (null == l3) {
    if (null === d3)
      return document.createTextNode(p2);
    l3 = o3 ? document.createElementNS("http://www.w3.org/2000/svg", d3) : document.createElement(d3, p2.is && p2), r3 = null, c3 = false;
  }
  if (null === d3)
    y3 === p2 || c3 && l3.data === p2 || (l3.data = p2);
  else {
    if (r3 = r3 && n.call(l3.childNodes), a3 = (y3 = i3.props || e).dangerouslySetInnerHTML, v3 = p2.dangerouslySetInnerHTML, !c3) {
      if (null != r3)
        for (y3 = {}, _2 = 0; _2 < l3.attributes.length; _2++)
          y3[l3.attributes[_2].name] = l3.attributes[_2].value;
      (v3 || a3) && (v3 && (a3 && v3.__html == a3.__html || v3.__html === l3.innerHTML) || (l3.innerHTML = v3 && v3.__html || ""));
    }
    if (C(l3, p2, y3, o3, c3), v3)
      u3.__k = [];
    else if (_2 = u3.props.children, w(l3, Array.isArray(_2) ? _2 : [_2], u3, i3, t3, o3 && "foreignObject" !== d3, r3, f3, r3 ? r3[0] : i3.__k && k(i3, 0), c3), null != r3)
      for (_2 = r3.length; _2--; )
        null != r3[_2] && h(r3[_2]);
    c3 || ("value" in p2 && void 0 !== (_2 = p2.value) && (_2 !== l3.value || "progress" === d3 && !_2 || "option" === d3 && _2 !== y3.value) && H(l3, "value", _2, y3.value, false), "checked" in p2 && void 0 !== (_2 = p2.checked) && _2 !== l3.checked && H(l3, "checked", _2, y3.checked, false));
  }
  return l3;
}
function M(n2, u3, i3) {
  try {
    "function" == typeof n2 ? n2(u3) : n2.current = u3;
  } catch (n3) {
    l.__e(n3, i3);
  }
}
function N(n2, u3, i3) {
  var t3, o3;
  if (l.unmount && l.unmount(n2), (t3 = n2.ref) && (t3.current && t3.current !== n2.__e || M(t3, null, u3)), null != (t3 = n2.__c)) {
    if (t3.componentWillUnmount)
      try {
        t3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u3);
      }
    t3.base = t3.__P = null;
  }
  if (t3 = n2.__k)
    for (o3 = 0; o3 < t3.length; o3++)
      t3[o3] && N(t3[o3], u3, "function" != typeof n2.type);
  i3 || null == n2.__e || h(n2.__e), n2.__e = n2.__d = void 0;
}
function O(n2, l3, u3) {
  return this.constructor(n2, u3);
}
function S(u3, i3, t3) {
  var o3, r3, f3;
  l.__ && l.__(u3, i3), r3 = (o3 = "function" == typeof t3) ? null : t3 && t3.__k || i3.__k, f3 = [], j(i3, u3 = (!o3 && t3 || i3).__k = v(d, null, [u3]), r3 || e, e, void 0 !== i3.ownerSVGElement, !o3 && t3 ? [t3] : r3 ? null : i3.firstChild ? n.call(i3.childNodes) : null, f3, !o3 && t3 ? t3 : r3 ? r3.__e : i3.firstChild, o3), z(f3, u3);
}
function q(n2, l3) {
  S(n2, l3, q);
}
n = c.slice, l = { __e: function(n2, l3, u3, i3) {
  for (var t3, o3, r3; l3 = l3.__; )
    if ((t3 = l3.__c) && !t3.__)
      try {
        if ((o3 = t3.constructor) && null != o3.getDerivedStateFromError && (t3.setState(o3.getDerivedStateFromError(n2)), r3 = t3.__d), null != t3.componentDidCatch && (t3.componentDidCatch(n2, i3 || {}), r3 = t3.__d), r3)
          return t3.__E = t3;
      } catch (l4) {
        n2 = l4;
      }
  throw n2;
} }, u = 0, i = function(n2) {
  return null != n2 && void 0 === n2.constructor;
}, _.prototype.setState = function(n2, l3) {
  var u3;
  u3 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = a({}, this.state), "function" == typeof n2 && (n2 = n2(a({}, u3), this.props)), n2 && a(u3, n2), null != n2 && this.__v && (l3 && this.__h.push(l3), m(this));
}, _.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), m(this));
}, _.prototype.render = d, t = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, g.__r = 0, f = 0;

// ../../node_modules/.pnpm/preact@10.8.2/node_modules/preact/hooks/dist/hooks.module.js
var t2;
var u2;
var r2;
var o2;
var i2 = 0;
var c2 = [];
var f2 = [];
var e2 = l.__b;
var a2 = l.__r;
var v2 = l.diffed;
var l2 = l.__c;
var m2 = l.unmount;
function p(t3, r3) {
  l.__h && l.__h(u2, t3, i2 || r3), i2 = 0;
  var o3 = u2.__H || (u2.__H = { __: [], __h: [] });
  return t3 >= o3.__.length && o3.__.push({ __V: f2 }), o3.__[t3];
}
function y2(n2) {
  return i2 = 1, d2(z2, n2);
}
function d2(n2, r3, o3) {
  var i3 = p(t2++, 2);
  return i3.t = n2, i3.__c || (i3.__ = [o3 ? o3(r3) : z2(void 0, r3), function(n3) {
    var t3 = i3.t(i3.__[0], n3);
    i3.__[0] !== t3 && (i3.__ = [t3, i3.__[1]], i3.__c.setState({}));
  }], i3.__c = u2), i3.__;
}
function b2() {
  for (var t3; t3 = c2.shift(); )
    if (t3.__P)
      try {
        t3.__H.__h.forEach(j2), t3.__H.__h.forEach(k2), t3.__H.__h = [];
      } catch (u3) {
        t3.__H.__h = [], l.__e(u3, t3.__v);
      }
}
l.__b = function(n2) {
  u2 = null, e2 && e2(n2);
}, l.__r = function(n2) {
  a2 && a2(n2), t2 = 0;
  var o3 = (u2 = n2.__c).__H;
  o3 && (r2 === u2 ? (o3.__h = [], u2.__h = [], o3.__.forEach(function(n3) {
    n3.__V = f2, n3.u = void 0;
  })) : (o3.__h.forEach(j2), o3.__h.forEach(k2), o3.__h = [])), r2 = u2;
}, l.diffed = function(t3) {
  v2 && v2(t3);
  var i3 = t3.__c;
  i3 && i3.__H && (i3.__H.__h.length && (1 !== c2.push(i3) && o2 === l.requestAnimationFrame || ((o2 = l.requestAnimationFrame) || function(n2) {
    var t4, u3 = function() {
      clearTimeout(r3), g2 && cancelAnimationFrame(t4), setTimeout(n2);
    }, r3 = setTimeout(u3, 100);
    g2 && (t4 = requestAnimationFrame(u3));
  })(b2)), i3.__H.__.forEach(function(n2) {
    n2.u && (n2.__H = n2.u), n2.__V !== f2 && (n2.__ = n2.__V), n2.u = void 0, n2.__V = f2;
  })), r2 = u2 = null;
}, l.__c = function(t3, u3) {
  u3.some(function(t4) {
    try {
      t4.__h.forEach(j2), t4.__h = t4.__h.filter(function(n2) {
        return !n2.__ || k2(n2);
      });
    } catch (r3) {
      u3.some(function(n2) {
        n2.__h && (n2.__h = []);
      }), u3 = [], l.__e(r3, t4.__v);
    }
  }), l2 && l2(t3, u3);
}, l.unmount = function(t3) {
  m2 && m2(t3);
  var u3, r3 = t3.__c;
  r3 && r3.__H && (r3.__H.__.forEach(function(n2) {
    try {
      j2(n2);
    } catch (n3) {
      u3 = n3;
    }
  }), u3 && l.__e(u3, r3.__v));
};
var g2 = "function" == typeof requestAnimationFrame;
function j2(n2) {
  var t3 = u2, r3 = n2.__c;
  "function" == typeof r3 && (n2.__c = void 0, r3()), u2 = t3;
}
function k2(n2) {
  var t3 = u2;
  n2.__c = n2.__(), u2 = t3;
}
function z2(n2, t3) {
  return "function" == typeof t3 ? t3(n2) : t3;
}

// App.tsx
var App = () => {
  const [count, setCount] = y2(0);
  return /* @__PURE__ */ v("div", null, /* @__PURE__ */ v("h1", null, "Hello World!"), /* @__PURE__ */ v("p", null, "Count: ", count), /* @__PURE__ */ v("button", {
    type: "button",
    onClick: () => setCount(count + 1)
  }, "Increment"));
};
if (typeof window !== "undefined") {
  q(/* @__PURE__ */ v(App, null), document.getElementById("root"));
}
var App_default = App;
export {
  App_default as default
};
