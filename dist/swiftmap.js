// https://github.com/HarryStevens/swiftmap#readme Version 0.0.23. Copyright 2018 Harry Stevens.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.swiftmap = {})));
}(this, (function (exports) { 'use strict';

  var xhtml = "http://www.w3.org/1999/xhtml";

  var namespaces = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  function namespace(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
  }

  function creatorInherit(name) {
    return function() {
      var document = this.ownerDocument,
          uri = this.namespaceURI;
      return uri === xhtml && document.documentElement.namespaceURI === xhtml
          ? document.createElement(name)
          : document.createElementNS(uri, name);
    };
  }

  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator(name) {
    var fullname = namespace(name);
    return (fullname.local
        ? creatorFixed
        : creatorInherit)(fullname);
  }

  function none() {}

  function selector(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  function selection_select(select) {
    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function empty() {
    return [];
  }

  function selectorAll(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  function selection_selectAll(select) {
    if (typeof select !== "function") select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection(subgroups, parents);
  }

  var matcher = function(selector) {
    return function() {
      return this.matches(selector);
    };
  };

  if (typeof document !== "undefined") {
    var element = document.documentElement;
    if (!element.matches) {
      var vendorMatches = element.webkitMatchesSelector
          || element.msMatchesSelector
          || element.mozMatchesSelector
          || element.oMatchesSelector;
      matcher = function(selector) {
        return function() {
          return vendorMatches.call(this, selector);
        };
      };
    }
  }

  var matcher$1 = matcher;

  function selection_filter(match) {
    if (typeof match !== "function") match = matcher$1(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function sparse(update) {
    return new Array(update.length);
  }

  function selection_enter() {
    return new Selection(this._enter || this._groups.map(sparse), this._parents);
  }

  function EnterNode(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
    insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
    querySelector: function(selector) { return this._parent.querySelector(selector); },
    querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
  };

  function constant(x) {
    return function() {
      return x;
    };
  }

  var keyPrefix = "$"; // Protect against keys like “__proto__”.

  function bindIndex(parent, group, enter, update, exit, data) {
    var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey(parent, group, enter, update, exit, data, key) {
    var i,
        node,
        nodeByKeyValue = {},
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
        if (keyValue in nodeByKeyValue) {
          exit[i] = node;
        } else {
          nodeByKeyValue[keyValue] = node;
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = keyPrefix + key.call(parent, data[i], i, data);
      if (node = nodeByKeyValue[keyValue]) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue[keyValue] = null;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
        exit[i] = node;
      }
    }
  }

  function selection_data(value, key) {
    if (!value) {
      data = new Array(this.size()), j = -1;
      this.each(function(d) { data[++j] = d; });
      return data;
    }

    var bind = key ? bindKey : bindIndex,
        parents = this._parents,
        groups = this._groups;

    if (typeof value !== "function") value = constant(value);

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = value.call(parent, parent && parent.__data__, j, parents),
          dataLength = data.length,
          enterGroup = enter[j] = new Array(dataLength),
          updateGroup = update[j] = new Array(dataLength),
          exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null;
        }
      }
    }

    update = new Selection(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  function selection_exit() {
    return new Selection(this._exit || this._groups.map(sparse), this._parents);
  }

  function selection_merge(selection$$1) {

    for (var groups0 = this._groups, groups1 = selection$$1._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection(merges, this._parents);
  }

  function selection_order() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort(compare) {
    if (!compare) compare = ascending;

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection(sortgroups, this._parents).order();
  }

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes() {
    var nodes = new Array(this.size()), i = -1;
    this.each(function() { nodes[++i] = this; });
    return nodes;
  }

  function selection_node() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }

    return null;
  }

  function selection_size() {
    var size = 0;
    this.each(function() { ++size; });
    return size;
  }

  function selection_empty() {
    return !this.node();
  }

  function selection_each(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }

    return this;
  }

  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }

  function attrFunctionNS(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }

  function selection_attr(name, value) {
    var fullname = namespace(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
    }

    return this.each((value == null
        ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
        ? (fullname.local ? attrFunctionNS : attrFunction)
        : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
  }

  function defaultView(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView; // node is a Document
  }

  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }

  function selection_style(name, value, priority) {
    return arguments.length > 1
        ? this.each((value == null
              ? styleRemove : typeof value === "function"
              ? styleFunction
              : styleConstant)(name, value, priority == null ? "" : priority))
        : styleValue(this.node(), name);
  }

  function styleValue(node, name) {
    return node.style.getPropertyValue(name)
        || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }

  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }

  function propertyFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }

  function selection_property(name, value) {
    return arguments.length > 1
        ? this.each((value == null
            ? propertyRemove : typeof value === "function"
            ? propertyFunction
            : propertyConstant)(name, value))
        : this.node()[name];
  }

  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList(node) {
    return node.classList || new ClassList(node);
  }

  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }

  ClassList.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };

  function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }

  function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }

  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }

  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }

  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }

  function selection_classed(name, value) {
    var names = classArray(name + "");

    if (arguments.length < 2) {
      var list = classList(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction : value
        ? classedTrue
        : classedFalse)(names, value));
  }

  function textRemove() {
    this.textContent = "";
  }

  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }

  function selection_text(value) {
    return arguments.length
        ? this.each(value == null
            ? textRemove : (typeof value === "function"
            ? textFunction
            : textConstant)(value))
        : this.node().textContent;
  }

  function htmlRemove() {
    this.innerHTML = "";
  }

  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }

  function htmlFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }

  function selection_html(value) {
    return arguments.length
        ? this.each(value == null
            ? htmlRemove : (typeof value === "function"
            ? htmlFunction
            : htmlConstant)(value))
        : this.node().innerHTML;
  }

  function raise() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }

  function selection_raise() {
    return this.each(raise);
  }

  function lower() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }

  function selection_lower() {
    return this.each(lower);
  }

  function selection_append(name) {
    var create = typeof name === "function" ? name : creator(name);
    return this.select(function() {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull() {
    return null;
  }

  function selection_insert(name, before) {
    var create = typeof name === "function" ? name : creator(name),
        select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
    return this.select(function() {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }

  function selection_remove() {
    return this.each(remove);
  }

  function selection_cloneShallow() {
    return this.parentNode.insertBefore(this.cloneNode(false), this.nextSibling);
  }

  function selection_cloneDeep() {
    return this.parentNode.insertBefore(this.cloneNode(true), this.nextSibling);
  }

  function selection_clone(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  function selection_datum(value) {
    return arguments.length
        ? this.property("__data__", value)
        : this.node().__data__;
  }

  var filterEvents = {};

  if (typeof document !== "undefined") {
    var element$1 = document.documentElement;
    if (!("onmouseenter" in element$1)) {
      filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
    }
  }

  function filterContextListener(listener, index, group) {
    listener = contextListener(listener, index, group);
    return function(event) {
      var related = event.relatedTarget;
      if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
        listener.call(this, event);
      }
    };
  }

  function contextListener(listener, index, group) {
    return function(event1) {
      try {
        listener.call(this, this.__data__, index, group);
      } finally {
      }
    };
  }

  function parseTypenames(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return {type: t, name: name};
    });
  }

  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }

  function onAdd(typename, value, capture) {
    var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
    return function(d, i, group) {
      var on = this.__on, o, listener = wrap(value, i, group);
      if (on) for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
          this.addEventListener(o.type, o.listener = listener, o.capture = capture);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, capture);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }

  function selection_on(typename, value, capture) {
    var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }

    on = value ? onAdd : onRemove;
    if (capture == null) capture = false;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
    return this;
  }

  function dispatchEvent(node, type, params) {
    var window = defaultView(node),
        event = window.CustomEvent;

    if (typeof event === "function") {
      event = new event(type, params);
    } else {
      event = window.document.createEvent("Event");
      if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type, false, false);
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant(type, params) {
    return function() {
      return dispatchEvent(this, type, params);
    };
  }

  function dispatchFunction(type, params) {
    return function() {
      return dispatchEvent(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch(type, params) {
    return this.each((typeof params === "function"
        ? dispatchFunction
        : dispatchConstant)(type, params));
  }

  var root = [null];

  function Selection(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection() {
    return new Selection([[document.documentElement]], root);
  }

  Selection.prototype = selection.prototype = {
    constructor: Selection,
    select: selection_select,
    selectAll: selection_selectAll,
    filter: selection_filter,
    data: selection_data,
    enter: selection_enter,
    exit: selection_exit,
    merge: selection_merge,
    order: selection_order,
    sort: selection_sort,
    call: selection_call,
    nodes: selection_nodes,
    node: selection_node,
    size: selection_size,
    empty: selection_empty,
    each: selection_each,
    attr: selection_attr,
    style: selection_style,
    property: selection_property,
    classed: selection_classed,
    text: selection_text,
    html: selection_html,
    raise: selection_raise,
    lower: selection_lower,
    append: selection_append,
    insert: selection_insert,
    remove: selection_remove,
    clone: selection_clone,
    datum: selection_datum,
    on: selection_on,
    dispatch: selection_dispatch
  };

  function select(selector) {
    return typeof selector === "string"
        ? new Selection([[document.querySelector(selector)]], [document.documentElement])
        : new Selection([[selector]], root);
  }

  var noop = {value: function() {}};

  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }

  function Dispatch(_) {
    this._ = _;
  }

  function parseTypenames$1(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {type: t, name: name};
    });
  }

  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._,
          T = parseTypenames$1(typename + "", _),
          t,
          i = -1,
          n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
      }

      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };

  function get(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }

  function set(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({name: name, value: callback});
    return type;
  }

  var frame = 0, // is an animation frame pending?
      timeout = 0, // is a timeout pending?
      interval = 0, // are any timers active?
      pokeDelay = 1000, // how frequently we check for clock skew
      taskHead,
      taskTail,
      clockLast = 0,
      clockNow = 0,
      clockSkew = 0,
      clock = typeof performance === "object" && performance.now ? performance : Date,
      setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }

  function clearNow() {
    clockNow = 0;
  }

  function Timer() {
    this._call =
    this._time =
    this._next = null;
  }

  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function") throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail) taskTail._next = this;
        else taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };

  function timer(callback, delay, time) {
    var t = new Timer;
    t.restart(callback, delay, time);
    return t;
  }

  function timerFlush() {
    now(); // Get the current time, if not already set.
    ++frame; // Pretend we’ve set an alarm, if we haven’t already.
    var t = taskHead, e;
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
      t = t._next;
    }
    --frame;
  }

  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew;
    frame = timeout = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }

  function poke() {
    var now = clock.now(), delay = now - clockLast;
    if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
  }

  function nap() {
    var t0, t1 = taskHead, t2, time = Infinity;
    while (t1) {
      if (t1._call) {
        if (time > t1._time) time = t1._time;
        t0 = t1, t1 = t1._next;
      } else {
        t2 = t1._next, t1._next = null;
        t1 = t0 ? t0._next = t2 : taskHead = t2;
      }
    }
    taskTail = t0;
    sleep(time);
  }

  function sleep(time) {
    if (frame) return; // Soonest alarm already set, or will be.
    if (timeout) timeout = clearTimeout(timeout);
    var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
    if (delay > 24) {
      if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
      if (interval) interval = clearInterval(interval);
    } else {
      if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  function timeout$1(callback, delay, time) {
    var t = new Timer;
    delay = delay == null ? 0 : +delay;
    t.restart(function(elapsed) {
      t.stop();
      callback(elapsed + delay);
    }, delay, time);
    return t;
  }

  var emptyOn = dispatch("start", "end", "interrupt");
  var emptyTween = [];

  var CREATED = 0;
  var SCHEDULED = 1;
  var STARTING = 2;
  var STARTED = 3;
  var RUNNING = 4;
  var ENDING = 5;
  var ENDED = 6;

  function schedule(node, name, id, index, group, timing) {
    var schedules = node.__transition;
    if (!schedules) node.__transition = {};
    else if (id in schedules) return;
    create$1(node, id, {
      name: name,
      index: index, // For context during callback.
      group: group, // For context during callback.
      on: emptyOn,
      tween: emptyTween,
      time: timing.time,
      delay: timing.delay,
      duration: timing.duration,
      ease: timing.ease,
      timer: null,
      state: CREATED
    });
  }

  function init(node, id) {
    var schedule = get$1(node, id);
    if (schedule.state > CREATED) throw new Error("too late; already scheduled");
    return schedule;
  }

  function set$1(node, id) {
    var schedule = get$1(node, id);
    if (schedule.state > STARTING) throw new Error("too late; already started");
    return schedule;
  }

  function get$1(node, id) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
    return schedule;
  }

  function create$1(node, id, self) {
    var schedules = node.__transition,
        tween;

    // Initialize the self timer when the transition is created.
    // Note the actual delay is not known until the first callback!
    schedules[id] = self;
    self.timer = timer(schedule, 0, self.time);

    function schedule(elapsed) {
      self.state = SCHEDULED;
      self.timer.restart(start, self.delay, self.time);

      // If the elapsed delay is less than our first sleep, start immediately.
      if (self.delay <= elapsed) start(elapsed - self.delay);
    }

    function start(elapsed) {
      var i, j, n, o;

      // If the state is not SCHEDULED, then we previously errored on start.
      if (self.state !== SCHEDULED) return stop();

      for (i in schedules) {
        o = schedules[i];
        if (o.name !== self.name) continue;

        // While this element already has a starting transition during this frame,
        // defer starting an interrupting transition until that transition has a
        // chance to tick (and possibly end); see d3/d3-transition#54!
        if (o.state === STARTED) return timeout$1(start);

        // Interrupt the active transition, if any.
        // Dispatch the interrupt event.
        if (o.state === RUNNING) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("interrupt", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }

        // Cancel any pre-empted transitions. No interrupt event is dispatched
        // because the cancelled transitions never started. Note that this also
        // removes this transition from the pending list!
        else if (+i < id) {
          o.state = ENDED;
          o.timer.stop();
          delete schedules[i];
        }
      }

      // Defer the first tick to end of the current frame; see d3/d3#1576.
      // Note the transition may be canceled after start and before the first tick!
      // Note this must be scheduled before the start event; see d3/d3-transition#16!
      // Assuming this is successful, subsequent callbacks go straight to tick.
      timeout$1(function() {
        if (self.state === STARTED) {
          self.state = RUNNING;
          self.timer.restart(tick, self.delay, self.time);
          tick(elapsed);
        }
      });

      // Dispatch the start event.
      // Note this must be done before the tween are initialized.
      self.state = STARTING;
      self.on.call("start", node, node.__data__, self.index, self.group);
      if (self.state !== STARTING) return; // interrupted
      self.state = STARTED;

      // Initialize the tween, deleting null tween.
      tween = new Array(n = self.tween.length);
      for (i = 0, j = -1; i < n; ++i) {
        if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
          tween[++j] = o;
        }
      }
      tween.length = j + 1;
    }

    function tick(elapsed) {
      var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
          i = -1,
          n = tween.length;

      while (++i < n) {
        tween[i].call(null, t);
      }

      // Dispatch the end event.
      if (self.state === ENDING) {
        self.on.call("end", node, node.__data__, self.index, self.group);
        stop();
      }
    }

    function stop() {
      self.state = ENDED;
      self.timer.stop();
      delete schedules[id];
      for (var i in schedules) return; // eslint-disable-line no-unused-vars
      delete node.__transition;
    }
  }

  function interrupt(node, name) {
    var schedules = node.__transition,
        schedule$$1,
        active,
        empty = true,
        i;

    if (!schedules) return;

    name = name == null ? null : name + "";

    for (i in schedules) {
      if ((schedule$$1 = schedules[i]).name !== name) { empty = false; continue; }
      active = schedule$$1.state > STARTING && schedule$$1.state < ENDING;
      schedule$$1.state = ENDED;
      schedule$$1.timer.stop();
      if (active) schedule$$1.on.call("interrupt", node, node.__data__, schedule$$1.index, schedule$$1.group);
      delete schedules[i];
    }

    if (empty) delete node.__transition;
  }

  function selection_interrupt(name) {
    return this.each(function() {
      interrupt(this, name);
    });
  }

  function define(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }

  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}

  var darker = 0.7;
  var brighter = 1 / darker;

  var reI = "\\s*([+-]?\\d+)\\s*",
      reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
      reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
      reHex3 = /^#([0-9a-f]{3})$/,
      reHex6 = /^#([0-9a-f]{6})$/,
      reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
      reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
      reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
      reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
      reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
      reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };

  define(Color, color, {
    displayable: function() {
      return this.rgb().displayable();
    },
    toString: function() {
      return this.rgb() + "";
    }
  });

  function color(format) {
    var m;
    format = (format + "").trim().toLowerCase();
    return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
        : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
        : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
        : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
        : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
        : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
        : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
        : named.hasOwnProperty(format) ? rgbn(named[format])
        : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
        : null;
  }

  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }

  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }

  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb;
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }

  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }

  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Rgb, rgb, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb: function() {
      return this;
    },
    displayable: function() {
      return (0 <= this.r && this.r <= 255)
          && (0 <= this.g && this.g <= 255)
          && (0 <= this.b && this.b <= 255)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    toString: function() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "rgb(" : "rgba(")
          + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.b) || 0))
          + (a === 1 ? ")" : ", " + a + ")");
    }
  }));

  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }

  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl;
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        h = NaN,
        s = max - min,
        l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;
      else if (g === max) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }

  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }

  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hsl, hsl, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = this.h % 360 + (this.h < 0) * 360,
          s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
          l = this.l,
          m2 = l + (l < 0.5 ? l : 1 - l) * s,
          m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    displayable: function() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s))
          && (0 <= this.l && this.l <= 1)
          && (0 <= this.opacity && this.opacity <= 1);
    }
  }));

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60
        : h < 180 ? m2
        : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
        : m1) * 255;
  }

  var deg2rad = Math.PI / 180;
  var rad2deg = 180 / Math.PI;

  var Kn = 18,
      Xn = 0.950470, // D65 standard referent
      Yn = 1,
      Zn = 1.088830,
      t0 = 4 / 29,
      t1 = 6 / 29,
      t2 = 3 * t1 * t1,
      t3 = t1 * t1 * t1;

  function labConvert(o) {
    if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
    if (o instanceof Hcl) {
      var h = o.h * deg2rad;
      return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
    }
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var b = rgb2xyz(o.r),
        a = rgb2xyz(o.g),
        l = rgb2xyz(o.b),
        x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
        y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
        z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
    return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
  }

  function lab(l, a, b, opacity) {
    return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
  }

  function Lab(l, a, b, opacity) {
    this.l = +l;
    this.a = +a;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Lab, lab, extend(Color, {
    brighter: function(k) {
      return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    darker: function(k) {
      return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    rgb: function() {
      var y = (this.l + 16) / 116,
          x = isNaN(this.a) ? y : y + this.a / 500,
          z = isNaN(this.b) ? y : y - this.b / 200;
      y = Yn * lab2xyz(y);
      x = Xn * lab2xyz(x);
      z = Zn * lab2xyz(z);
      return new Rgb(
        xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
        xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
        xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
        this.opacity
      );
    }
  }));

  function xyz2lab(t) {
    return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
  }

  function lab2xyz(t) {
    return t > t1 ? t * t * t : t2 * (t - t0);
  }

  function xyz2rgb(x) {
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  }

  function rgb2xyz(x) {
    return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }

  function hclConvert(o) {
    if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
    if (!(o instanceof Lab)) o = labConvert(o);
    var h = Math.atan2(o.b, o.a) * rad2deg;
    return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
  }

  function hcl(h, c, l, opacity) {
    return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
  }

  function Hcl(h, c, l, opacity) {
    this.h = +h;
    this.c = +c;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hcl, hcl, extend(Color, {
    brighter: function(k) {
      return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
    },
    darker: function(k) {
      return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
    },
    rgb: function() {
      return labConvert(this).rgb();
    }
  }));

  var A = -0.14861,
      B = +1.78277,
      C = -0.29227,
      D = -0.90649,
      E = +1.97294,
      ED = E * D,
      EB = E * B,
      BC_DA = B * C - D * A;

  function cubehelixConvert(o) {
    if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
        bl = b - l,
        k = (E * (g - l) - C * bl) / D,
        s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
        h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
    return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
  }

  function cubehelix(h, s, l, opacity) {
    return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
  }

  function Cubehelix(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Cubehelix, cubehelix, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
          l = +this.l,
          a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
          cosh = Math.cos(h),
          sinh = Math.sin(h);
      return new Rgb(
        255 * (l + a * (A * cosh + B * sinh)),
        255 * (l + a * (C * cosh + D * sinh)),
        255 * (l + a * (E * cosh)),
        this.opacity
      );
    }
  }));

  function constant$1(x) {
    return function() {
      return x;
    };
  }

  function linear(a, d) {
    return function(t) {
      return a + t * d;
    };
  }

  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
      return Math.pow(a + t * b, y);
    };
  }

  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential(a, b, y) : constant$1(isNaN(a) ? b : a);
    };
  }

  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant$1(isNaN(a) ? b : a);
  }

  var interpolateRgb = (function rgbGamma(y) {
    var color$$1 = gamma(y);

    function rgb$$1(start, end) {
      var r = color$$1((start = rgb(start)).r, (end = rgb(end)).r),
          g = color$$1(start.g, end.g),
          b = color$$1(start.b, end.b),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }

    rgb$$1.gamma = rgbGamma;

    return rgb$$1;
  })(1);

  function interpolateNumber(a, b) {
    return a = +a, b -= a, function(t) {
      return a + b * t;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
      reB = new RegExp(reA.source, "g");

  function zero(b) {
    return function() {
      return b;
    };
  }

  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }

  function interpolateString(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
        am, // current match in a
        bm, // current match in b
        bs, // string preceding current number in b, if any
        i = -1, // index in s
        s = [], // string constants and placeholders
        q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + "", b = b + "";

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a))
        && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) { // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
        if (s[i]) s[i] += bm; // coalesce with previous string
        else s[++i] = bm;
      } else { // interpolate non-matching numbers
        s[++i] = null;
        q.push({i: i, x: interpolateNumber(am, bm)});
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? (q[0]
        ? one(q[0].x)
        : zero(b))
        : (b = q.length, function(t) {
            for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
            return s.join("");
          });
  }

  var degrees = 180 / Math.PI;

  var identity = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1
  };

  function decompose(a, b, c, d, e, f) {
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e,
      translateY: f,
      rotate: Math.atan2(b, a) * degrees,
      skewX: Math.atan(skewX) * degrees,
      scaleX: scaleX,
      scaleY: scaleY
    };
  }

  var cssNode,
      cssRoot,
      cssView,
      svgNode;

  function parseCss(value) {
    if (value === "none") return identity;
    if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
    cssNode.style.transform = value;
    value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
    cssRoot.removeChild(cssNode);
    value = value.slice(7, -1).split(",");
    return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
  }

  function parseSvg(value) {
    if (value == null) return identity;
    if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgNode.setAttribute("transform", value);
    if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
    value = value.matrix;
    return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
  }

  function interpolateTransform(parse, pxComma, pxParen, degParen) {

    function pop(s) {
      return s.length ? s.pop() + " " : "";
    }

    function translate(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push("translate(", null, pxComma, null, pxParen);
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb || yb) {
        s.push("translate(" + xb + pxComma + yb + pxParen);
      }
    }

    function rotate(a, b, s, q) {
      if (a !== b) {
        if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
        q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "rotate(" + b + degParen);
      }
    }

    function skewX(a, b, s, q) {
      if (a !== b) {
        q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "skewX(" + b + degParen);
      }
    }

    function scale(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push(pop(s) + "scale(", null, ",", null, ")");
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb !== 1 || yb !== 1) {
        s.push(pop(s) + "scale(" + xb + "," + yb + ")");
      }
    }

    return function(a, b) {
      var s = [], // string constants and placeholders
          q = []; // number interpolators
      a = parse(a), b = parse(b);
      translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
      rotate(a.rotate, b.rotate, s, q);
      skewX(a.skewX, b.skewX, s, q);
      scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
      a = b = null; // gc
      return function(t) {
        var i = -1, n = q.length, o;
        while (++i < n) s[(o = q[i]).i] = o.x(t);
        return s.join("");
      };
    };
  }

  var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
  var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

  var rho = Math.SQRT2;

  function tweenRemove(id, name) {
    var tween0, tween1;
    return function() {
      var schedule$$1 = set$1(this, id),
          tween = schedule$$1.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = tween0 = tween;
        for (var i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1 = tween1.slice();
            tween1.splice(i, 1);
            break;
          }
        }
      }

      schedule$$1.tween = tween1;
    };
  }

  function tweenFunction(id, name, value) {
    var tween0, tween1;
    if (typeof value !== "function") throw new Error;
    return function() {
      var schedule$$1 = set$1(this, id),
          tween = schedule$$1.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = (tween0 = tween).slice();
        for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1[i] = t;
            break;
          }
        }
        if (i === n) tween1.push(t);
      }

      schedule$$1.tween = tween1;
    };
  }

  function transition_tween(name, value) {
    var id = this._id;

    name += "";

    if (arguments.length < 2) {
      var tween = get$1(this.node(), id).tween;
      for (var i = 0, n = tween.length, t; i < n; ++i) {
        if ((t = tween[i]).name === name) {
          return t.value;
        }
      }
      return null;
    }

    return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
  }

  function tweenValue(transition, name, value) {
    var id = transition._id;

    transition.each(function() {
      var schedule$$1 = set$1(this, id);
      (schedule$$1.value || (schedule$$1.value = {}))[name] = value.apply(this, arguments);
    });

    return function(node) {
      return get$1(node, id).value[name];
    };
  }

  function interpolate(a, b) {
    var c;
    return (typeof b === "number" ? interpolateNumber
        : b instanceof color ? interpolateRgb
        : (c = color(b)) ? (b = c, interpolateRgb)
        : interpolateString)(a, b);
  }

  function attrRemove$1(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS$1(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant$1(name, interpolate$$1, value1) {
    var value00,
        interpolate0;
    return function() {
      var value0 = this.getAttribute(name);
      return value0 === value1 ? null
          : value0 === value00 ? interpolate0
          : interpolate0 = interpolate$$1(value00 = value0, value1);
    };
  }

  function attrConstantNS$1(fullname, interpolate$$1, value1) {
    var value00,
        interpolate0;
    return function() {
      var value0 = this.getAttributeNS(fullname.space, fullname.local);
      return value0 === value1 ? null
          : value0 === value00 ? interpolate0
          : interpolate0 = interpolate$$1(value00 = value0, value1);
    };
  }

  function attrFunction$1(name, interpolate$$1, value$$1) {
    var value00,
        value10,
        interpolate0;
    return function() {
      var value0, value1 = value$$1(this);
      if (value1 == null) return void this.removeAttribute(name);
      value0 = this.getAttribute(name);
      return value0 === value1 ? null
          : value0 === value00 && value1 === value10 ? interpolate0
          : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
  }

  function attrFunctionNS$1(fullname, interpolate$$1, value$$1) {
    var value00,
        value10,
        interpolate0;
    return function() {
      var value0, value1 = value$$1(this);
      if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
      value0 = this.getAttributeNS(fullname.space, fullname.local);
      return value0 === value1 ? null
          : value0 === value00 && value1 === value10 ? interpolate0
          : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
  }

  function transition_attr(name, value$$1) {
    var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
    return this.attrTween(name, typeof value$$1 === "function"
        ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value$$1))
        : value$$1 == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
        : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value$$1 + ""));
  }

  function attrTweenNS(fullname, value) {
    function tween() {
      var node = this, i = value.apply(node, arguments);
      return i && function(t) {
        node.setAttributeNS(fullname.space, fullname.local, i(t));
      };
    }
    tween._value = value;
    return tween;
  }

  function attrTween(name, value) {
    function tween() {
      var node = this, i = value.apply(node, arguments);
      return i && function(t) {
        node.setAttribute(name, i(t));
      };
    }
    tween._value = value;
    return tween;
  }

  function transition_attrTween(name, value) {
    var key = "attr." + name;
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    var fullname = namespace(name);
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
  }

  function delayFunction(id, value) {
    return function() {
      init(this, id).delay = +value.apply(this, arguments);
    };
  }

  function delayConstant(id, value) {
    return value = +value, function() {
      init(this, id).delay = value;
    };
  }

  function transition_delay(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? delayFunction
            : delayConstant)(id, value))
        : get$1(this.node(), id).delay;
  }

  function durationFunction(id, value) {
    return function() {
      set$1(this, id).duration = +value.apply(this, arguments);
    };
  }

  function durationConstant(id, value) {
    return value = +value, function() {
      set$1(this, id).duration = value;
    };
  }

  function transition_duration(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? durationFunction
            : durationConstant)(id, value))
        : get$1(this.node(), id).duration;
  }

  function easeConstant(id, value) {
    if (typeof value !== "function") throw new Error;
    return function() {
      set$1(this, id).ease = value;
    };
  }

  function transition_ease(value) {
    var id = this._id;

    return arguments.length
        ? this.each(easeConstant(id, value))
        : get$1(this.node(), id).ease;
  }

  function transition_filter(match) {
    if (typeof match !== "function") match = matcher$1(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Transition(subgroups, this._parents, this._name, this._id);
  }

  function transition_merge(transition$$1) {
    if (transition$$1._id !== this._id) throw new Error;

    for (var groups0 = this._groups, groups1 = transition$$1._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Transition(merges, this._parents, this._name, this._id);
  }

  function start(name) {
    return (name + "").trim().split(/^|\s+/).every(function(t) {
      var i = t.indexOf(".");
      if (i >= 0) t = t.slice(0, i);
      return !t || t === "start";
    });
  }

  function onFunction(id, name, listener) {
    var on0, on1, sit = start(name) ? init : set$1;
    return function() {
      var schedule$$1 = sit(this, id),
          on = schedule$$1.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

      schedule$$1.on = on1;
    };
  }

  function transition_on(name, listener) {
    var id = this._id;

    return arguments.length < 2
        ? get$1(this.node(), id).on.on(name)
        : this.each(onFunction(id, name, listener));
  }

  function removeFunction(id) {
    return function() {
      var parent = this.parentNode;
      for (var i in this.__transition) if (+i !== id) return;
      if (parent) parent.removeChild(this);
    };
  }

  function transition_remove() {
    return this.on("end.remove", removeFunction(this._id));
  }

  function transition_select(select$$1) {
    var name = this._name,
        id = this._id;

    if (typeof select$$1 !== "function") select$$1 = selector(select$$1);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select$$1.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
          schedule(subgroup[i], name, id, i, subgroup, get$1(node, id));
        }
      }
    }

    return new Transition(subgroups, this._parents, name, id);
  }

  function transition_selectAll(select$$1) {
    var name = this._name,
        id = this._id;

    if (typeof select$$1 !== "function") select$$1 = selectorAll(select$$1);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          for (var children = select$$1.call(node, node.__data__, i, group), child, inherit = get$1(node, id), k = 0, l = children.length; k < l; ++k) {
            if (child = children[k]) {
              schedule(child, name, id, k, children, inherit);
            }
          }
          subgroups.push(children);
          parents.push(node);
        }
      }
    }

    return new Transition(subgroups, parents, name, id);
  }

  var Selection$1 = selection.prototype.constructor;

  function transition_selection() {
    return new Selection$1(this._groups, this._parents);
  }

  function styleRemove$1(name, interpolate$$1) {
    var value00,
        value10,
        interpolate0;
    return function() {
      var value0 = styleValue(this, name),
          value1 = (this.style.removeProperty(name), styleValue(this, name));
      return value0 === value1 ? null
          : value0 === value00 && value1 === value10 ? interpolate0
          : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
  }

  function styleRemoveEnd(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant$1(name, interpolate$$1, value1) {
    var value00,
        interpolate0;
    return function() {
      var value0 = styleValue(this, name);
      return value0 === value1 ? null
          : value0 === value00 ? interpolate0
          : interpolate0 = interpolate$$1(value00 = value0, value1);
    };
  }

  function styleFunction$1(name, interpolate$$1, value$$1) {
    var value00,
        value10,
        interpolate0;
    return function() {
      var value0 = styleValue(this, name),
          value1 = value$$1(this);
      if (value1 == null) value1 = (this.style.removeProperty(name), styleValue(this, name));
      return value0 === value1 ? null
          : value0 === value00 && value1 === value10 ? interpolate0
          : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
  }

  function transition_style(name, value$$1, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
    return value$$1 == null ? this
            .styleTween(name, styleRemove$1(name, i))
            .on("end.style." + name, styleRemoveEnd(name))
        : this.styleTween(name, typeof value$$1 === "function"
            ? styleFunction$1(name, i, tweenValue(this, "style." + name, value$$1))
            : styleConstant$1(name, i, value$$1 + ""), priority);
  }

  function styleTween(name, value, priority) {
    function tween() {
      var node = this, i = value.apply(node, arguments);
      return i && function(t) {
        node.style.setProperty(name, i(t), priority);
      };
    }
    tween._value = value;
    return tween;
  }

  function transition_styleTween(name, value, priority) {
    var key = "style." + (name += "");
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
  }

  function textConstant$1(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction$1(value) {
    return function() {
      var value1 = value(this);
      this.textContent = value1 == null ? "" : value1;
    };
  }

  function transition_text(value) {
    return this.tween("text", typeof value === "function"
        ? textFunction$1(tweenValue(this, "text", value))
        : textConstant$1(value == null ? "" : value + ""));
  }

  function transition_transition() {
    var name = this._name,
        id0 = this._id,
        id1 = newId();

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          var inherit = get$1(node, id0);
          schedule(node, name, id1, i, group, {
            time: inherit.time + inherit.delay + inherit.duration,
            delay: 0,
            duration: inherit.duration,
            ease: inherit.ease
          });
        }
      }
    }

    return new Transition(groups, this._parents, name, id1);
  }

  var id = 0;

  function Transition(groups, parents, name, id) {
    this._groups = groups;
    this._parents = parents;
    this._name = name;
    this._id = id;
  }

  function transition(name) {
    return selection().transition(name);
  }

  function newId() {
    return ++id;
  }

  var selection_prototype = selection.prototype;

  Transition.prototype = transition.prototype = {
    constructor: Transition,
    select: transition_select,
    selectAll: transition_selectAll,
    filter: transition_filter,
    merge: transition_merge,
    selection: transition_selection,
    transition: transition_transition,
    call: selection_prototype.call,
    nodes: selection_prototype.nodes,
    node: selection_prototype.node,
    size: selection_prototype.size,
    empty: selection_prototype.empty,
    each: selection_prototype.each,
    on: transition_on,
    attr: transition_attr,
    attrTween: transition_attrTween,
    style: transition_style,
    styleTween: transition_styleTween,
    text: transition_text,
    remove: transition_remove,
    tween: transition_tween,
    delay: transition_delay,
    duration: transition_duration,
    ease: transition_ease
  };

  function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
  }

  var pi = Math.PI;

  var tau = 2 * Math.PI;

  var defaultTiming = {
    time: null, // Set on use.
    delay: 0,
    duration: 250,
    ease: cubicInOut
  };

  function inherit(node, id) {
    var timing;
    while (!(timing = node.__transition) || !(timing = timing[id])) {
      if (!(node = node.parentNode)) {
        return defaultTiming.time = now(), defaultTiming;
      }
    }
    return timing;
  }

  function selection_transition(name) {
    var id,
        timing;

    if (name instanceof Transition) {
      id = name._id, name = name._name;
    } else {
      id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
    }

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          schedule(node, name, id, i, group, timing || inherit(node, id));
        }
      }
    }

    return new Transition(groups, this._parents, name, id);
  }

  selection.prototype.interrupt = selection_interrupt;
  selection.prototype.transition = selection_transition;

  // Adds floating point numbers with twice the normal precision.
  // Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
  // Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
  // 305–363 (1997).
  // Code adapted from GeographicLib by Charles F. F. Karney,
  // http://geographiclib.sourceforge.net/

  function adder() {
    return new Adder;
  }

  function Adder() {
    this.reset();
  }

  Adder.prototype = {
    constructor: Adder,
    reset: function() {
      this.s = // rounded value
      this.t = 0; // exact error
    },
    add: function(y) {
      add(temp, y, this.t);
      add(this, temp.s, this.s);
      if (this.s) this.t += temp.t;
      else this.s = temp.t;
    },
    valueOf: function() {
      return this.s;
    }
  };

  var temp = new Adder;

  function add(adder, a, b) {
    var x = adder.s = a + b,
        bv = x - a,
        av = x - bv;
    adder.t = (a - av) + (b - bv);
  }

  var epsilon = 1e-6;
  var pi$1 = Math.PI;
  var halfPi$1 = pi$1 / 2;
  var quarterPi = pi$1 / 4;
  var tau$1 = pi$1 * 2;

  var degrees$1 = 180 / pi$1;
  var radians = pi$1 / 180;

  var abs = Math.abs;
  var atan = Math.atan;
  var atan2 = Math.atan2;
  var cos = Math.cos;
  var exp = Math.exp;
  var log = Math.log;
  var sin = Math.sin;
  var sqrt = Math.sqrt;
  var tan = Math.tan;

  function acos(x) {
    return x > 1 ? 0 : x < -1 ? pi$1 : Math.acos(x);
  }

  function asin(x) {
    return x > 1 ? halfPi$1 : x < -1 ? -halfPi$1 : Math.asin(x);
  }

  function noop$1() {}

  function streamGeometry(geometry, stream) {
    if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
      streamGeometryType[geometry.type](geometry, stream);
    }
  }

  var streamObjectType = {
    Feature: function(object, stream) {
      streamGeometry(object.geometry, stream);
    },
    FeatureCollection: function(object, stream) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) streamGeometry(features[i].geometry, stream);
    }
  };

  var streamGeometryType = {
    Sphere: function(object, stream) {
      stream.sphere();
    },
    Point: function(object, stream) {
      object = object.coordinates;
      stream.point(object[0], object[1], object[2]);
    },
    MultiPoint: function(object, stream) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) object = coordinates[i], stream.point(object[0], object[1], object[2]);
    },
    LineString: function(object, stream) {
      streamLine(object.coordinates, stream, 0);
    },
    MultiLineString: function(object, stream) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) streamLine(coordinates[i], stream, 0);
    },
    Polygon: function(object, stream) {
      streamPolygon(object.coordinates, stream);
    },
    MultiPolygon: function(object, stream) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) streamPolygon(coordinates[i], stream);
    },
    GeometryCollection: function(object, stream) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) streamGeometry(geometries[i], stream);
    }
  };

  function streamLine(coordinates, stream, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    stream.lineStart();
    while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
    stream.lineEnd();
  }

  function streamPolygon(coordinates, stream) {
    var i = -1, n = coordinates.length;
    stream.polygonStart();
    while (++i < n) streamLine(coordinates[i], stream, 1);
    stream.polygonEnd();
  }

  function geoStream(object, stream) {
    if (object && streamObjectType.hasOwnProperty(object.type)) {
      streamObjectType[object.type](object, stream);
    } else {
      streamGeometry(object, stream);
    }
  }

  var areaRingSum = adder();

  var areaSum = adder();

  function spherical(cartesian) {
    return [atan2(cartesian[1], cartesian[0]), asin(cartesian[2])];
  }

  function cartesian(spherical) {
    var lambda = spherical[0], phi = spherical[1], cosPhi = cos(phi);
    return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi)];
  }

  function cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cartesianCross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  // TODO return a
  function cartesianAddInPlace(a, b) {
    a[0] += b[0], a[1] += b[1], a[2] += b[2];
  }

  function cartesianScale(vector, k) {
    return [vector[0] * k, vector[1] * k, vector[2] * k];
  }

  // TODO return d
  function cartesianNormalizeInPlace(d) {
    var l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l, d[1] /= l, d[2] /= l;
  }

  var deltaSum = adder();

  function compose(a, b) {

    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }

    if (a.invert && b.invert) compose.invert = function(x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };

    return compose;
  }

  function rotationIdentity(lambda, phi) {
    return [lambda > pi$1 ? lambda - tau$1 : lambda < -pi$1 ? lambda + tau$1 : lambda, phi];
  }

  rotationIdentity.invert = rotationIdentity;

  function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
    return (deltaLambda %= tau$1) ? (deltaPhi || deltaGamma ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma))
      : rotationLambda(deltaLambda))
      : (deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma)
      : rotationIdentity);
  }

  function forwardRotationLambda(deltaLambda) {
    return function(lambda, phi) {
      return lambda += deltaLambda, [lambda > pi$1 ? lambda - tau$1 : lambda < -pi$1 ? lambda + tau$1 : lambda, phi];
    };
  }

  function rotationLambda(deltaLambda) {
    var rotation = forwardRotationLambda(deltaLambda);
    rotation.invert = forwardRotationLambda(-deltaLambda);
    return rotation;
  }

  function rotationPhiGamma(deltaPhi, deltaGamma) {
    var cosDeltaPhi = cos(deltaPhi),
        sinDeltaPhi = sin(deltaPhi),
        cosDeltaGamma = cos(deltaGamma),
        sinDeltaGamma = sin(deltaGamma);

    function rotation(lambda, phi) {
      var cosPhi = cos(phi),
          x = cos(lambda) * cosPhi,
          y = sin(lambda) * cosPhi,
          z = sin(phi),
          k = z * cosDeltaPhi + x * sinDeltaPhi;
      return [
        atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi),
        asin(k * cosDeltaGamma + y * sinDeltaGamma)
      ];
    }

    rotation.invert = function(lambda, phi) {
      var cosPhi = cos(phi),
          x = cos(lambda) * cosPhi,
          y = sin(lambda) * cosPhi,
          z = sin(phi),
          k = z * cosDeltaGamma - y * sinDeltaGamma;
      return [
        atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi),
        asin(k * cosDeltaPhi - x * sinDeltaPhi)
      ];
    };

    return rotation;
  }

  function rotation(rotate) {
    rotate = rotateRadians(rotate[0] * radians, rotate[1] * radians, rotate.length > 2 ? rotate[2] * radians : 0);

    function forward(coordinates) {
      coordinates = rotate(coordinates[0] * radians, coordinates[1] * radians);
      return coordinates[0] *= degrees$1, coordinates[1] *= degrees$1, coordinates;
    }

    forward.invert = function(coordinates) {
      coordinates = rotate.invert(coordinates[0] * radians, coordinates[1] * radians);
      return coordinates[0] *= degrees$1, coordinates[1] *= degrees$1, coordinates;
    };

    return forward;
  }

  // Generates a circle centered at [0°, 0°], with a given radius and precision.
  function circleStream(stream, radius, delta, direction, t0, t1) {
    if (!delta) return;
    var cosRadius = cos(radius),
        sinRadius = sin(radius),
        step = direction * delta;
    if (t0 == null) {
      t0 = radius + direction * tau$1;
      t1 = radius - step / 2;
    } else {
      t0 = circleRadius(cosRadius, t0);
      t1 = circleRadius(cosRadius, t1);
      if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau$1;
    }
    for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
      point = spherical([cosRadius, -sinRadius * cos(t), -sinRadius * sin(t)]);
      stream.point(point[0], point[1]);
    }
  }

  // Returns the signed angle of a cartesian point relative to [cosRadius, 0, 0].
  function circleRadius(cosRadius, point) {
    point = cartesian(point), point[0] -= cosRadius;
    cartesianNormalizeInPlace(point);
    var radius = acos(-point[1]);
    return ((-point[2] < 0 ? -radius : radius) + tau$1 - epsilon) % tau$1;
  }

  function clipBuffer() {
    var lines = [],
        line;
    return {
      point: function(x, y) {
        line.push([x, y]);
      },
      lineStart: function() {
        lines.push(line = []);
      },
      lineEnd: noop$1,
      rejoin: function() {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      },
      result: function() {
        var result = lines;
        lines = [];
        line = null;
        return result;
      }
    };
  }

  function pointEqual(a, b) {
    return abs(a[0] - b[0]) < epsilon && abs(a[1] - b[1]) < epsilon;
  }

  function Intersection(point, points, other, entry) {
    this.x = point;
    this.z = points;
    this.o = other; // another intersection
    this.e = entry; // is an entry?
    this.v = false; // visited
    this.n = this.p = null; // next & previous
  }

  // A generalized polygon clipping algorithm: given a polygon that has been cut
  // into its visible line segments, and rejoins the segments by interpolating
  // along the clip edge.
  function clipRejoin(segments, compareIntersection, startInside, interpolate, stream) {
    var subject = [],
        clip = [],
        i,
        n;

    segments.forEach(function(segment) {
      if ((n = segment.length - 1) <= 0) return;
      var n, p0 = segment[0], p1 = segment[n], x;

      // If the first and last points of a segment are coincident, then treat as a
      // closed ring. TODO if all rings are closed, then the winding order of the
      // exterior ring should be checked.
      if (pointEqual(p0, p1)) {
        stream.lineStart();
        for (i = 0; i < n; ++i) stream.point((p0 = segment[i])[0], p0[1]);
        stream.lineEnd();
        return;
      }

      subject.push(x = new Intersection(p0, segment, null, true));
      clip.push(x.o = new Intersection(p0, null, x, false));
      subject.push(x = new Intersection(p1, segment, null, false));
      clip.push(x.o = new Intersection(p1, null, x, true));
    });

    if (!subject.length) return;

    clip.sort(compareIntersection);
    link(subject);
    link(clip);

    for (i = 0, n = clip.length; i < n; ++i) {
      clip[i].e = startInside = !startInside;
    }

    var start = subject[0],
        points,
        point;

    while (1) {
      // Find first unvisited intersection.
      var current = start,
          isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      stream.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (i = 0, n = points.length; i < n; ++i) stream.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.n.x, 1, stream);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (i = points.length - 1; i >= 0; --i) stream.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.p.x, -1, stream);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      stream.lineEnd();
    }
  }

  function link(array) {
    if (!(n = array.length)) return;
    var n,
        i = 0,
        a = array[0],
        b;
    while (++i < n) {
      a.n = b = array[i];
      b.p = a;
      a = b;
    }
    a.n = b = array[0];
    b.p = a;
  }

  var sum = adder();

  function polygonContains(polygon, point) {
    var lambda = point[0],
        phi = point[1],
        sinPhi = sin(phi),
        normal = [sin(lambda), -cos(lambda), 0],
        angle = 0,
        winding = 0;

    sum.reset();

    if (sinPhi === 1) phi = halfPi$1 + epsilon;
    else if (sinPhi === -1) phi = -halfPi$1 - epsilon;

    for (var i = 0, n = polygon.length; i < n; ++i) {
      if (!(m = (ring = polygon[i]).length)) continue;
      var ring,
          m,
          point0 = ring[m - 1],
          lambda0 = point0[0],
          phi0 = point0[1] / 2 + quarterPi,
          sinPhi0 = sin(phi0),
          cosPhi0 = cos(phi0);

      for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
        var point1 = ring[j],
            lambda1 = point1[0],
            phi1 = point1[1] / 2 + quarterPi,
            sinPhi1 = sin(phi1),
            cosPhi1 = cos(phi1),
            delta = lambda1 - lambda0,
            sign$$1 = delta >= 0 ? 1 : -1,
            absDelta = sign$$1 * delta,
            antimeridian = absDelta > pi$1,
            k = sinPhi0 * sinPhi1;

        sum.add(atan2(k * sign$$1 * sin(absDelta), cosPhi0 * cosPhi1 + k * cos(absDelta)));
        angle += antimeridian ? delta + sign$$1 * tau$1 : delta;

        // Are the longitudes either side of the point’s meridian (lambda),
        // and are the latitudes smaller than the parallel (phi)?
        if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
          var arc = cartesianCross(cartesian(point0), cartesian(point1));
          cartesianNormalizeInPlace(arc);
          var intersection = cartesianCross(normal, arc);
          cartesianNormalizeInPlace(intersection);
          var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin(intersection[2]);
          if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) {
            winding += antimeridian ^ delta >= 0 ? 1 : -1;
          }
        }
      }
    }

    // First, determine whether the South pole is inside or outside:
    //
    // It is inside if:
    // * the polygon winds around it in a clockwise direction.
    // * the polygon does not (cumulatively) wind around it, but has a negative
    //   (counter-clockwise) area.
    //
    // Second, count the (signed) number of times a segment crosses a lambda
    // from the point to the South pole.  If it is zero, then the point is the
    // same side as the South pole.

    return (angle < -epsilon || angle < epsilon && sum < -epsilon) ^ (winding & 1);
  }

  function ascending$1(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function bisector(compare) {
    if (compare.length === 1) compare = ascendingComparator(compare);
    return {
      left: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }
    };
  }

  function ascendingComparator(f) {
    return function(d, x) {
      return ascending$1(f(d), x);
    };
  }

  var ascendingBisect = bisector(ascending$1);

  function merge(arrays) {
    var n = arrays.length,
        m,
        i = -1,
        j = 0,
        merged,
        array;

    while (++i < n) j += arrays[i].length;
    merged = new Array(j);

    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }

    return merged;
  }

  function clip(pointVisible, clipLine, interpolate, start) {
    return function(sink) {
      var line = clipLine(sink),
          ringBuffer = clipBuffer(),
          ringSink = clipLine(ringBuffer),
          polygonStarted = false,
          polygon,
          segments,
          ring;

      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
        },
        polygonEnd: function() {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = merge(segments);
          var startInside = polygonContains(polygon, start);
          if (segments.length) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            clipRejoin(segments, compareIntersection, startInside, interpolate, sink);
          } else if (startInside) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            sink.lineStart();
            interpolate(null, null, 1, sink);
            sink.lineEnd();
          }
          if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
          segments = polygon = null;
        },
        sphere: function() {
          sink.polygonStart();
          sink.lineStart();
          interpolate(null, null, 1, sink);
          sink.lineEnd();
          sink.polygonEnd();
        }
      };

      function point(lambda, phi) {
        if (pointVisible(lambda, phi)) sink.point(lambda, phi);
      }

      function pointLine(lambda, phi) {
        line.point(lambda, phi);
      }

      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }

      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }

      function pointRing(lambda, phi) {
        ring.push([lambda, phi]);
        ringSink.point(lambda, phi);
      }

      function ringStart() {
        ringSink.lineStart();
        ring = [];
      }

      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringSink.lineEnd();

        var clean = ringSink.clean(),
            ringSegments = ringBuffer.result(),
            i, n = ringSegments.length, m,
            segment,
            point;

        ring.pop();
        polygon.push(ring);
        ring = null;

        if (!n) return;

        // No intersections.
        if (clean & 1) {
          segment = ringSegments[0];
          if ((m = segment.length - 1) > 0) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            sink.lineStart();
            for (i = 0; i < m; ++i) sink.point((point = segment[i])[0], point[1]);
            sink.lineEnd();
          }
          return;
        }

        // Rejoin connected segments.
        // TODO reuse ringBuffer.rejoin()?
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));

        segments.push(ringSegments.filter(validSegment));
      }

      return clip;
    };
  }

  function validSegment(segment) {
    return segment.length > 1;
  }

  // Intersections are sorted along the clip edge. For both antimeridian cutting
  // and circle clipping, the same comparison is used.
  function compareIntersection(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfPi$1 - epsilon : halfPi$1 - a[1])
         - ((b = b.x)[0] < 0 ? b[1] - halfPi$1 - epsilon : halfPi$1 - b[1]);
  }

  var clipAntimeridian = clip(
    function() { return true; },
    clipAntimeridianLine,
    clipAntimeridianInterpolate,
    [-pi$1, -halfPi$1]
  );

  // Takes a line and cuts into visible segments. Return values: 0 - there were
  // intersections or the line was empty; 1 - no intersections; 2 - there were
  // intersections, and the first and last segments should be rejoined.
  function clipAntimeridianLine(stream) {
    var lambda0 = NaN,
        phi0 = NaN,
        sign0 = NaN,
        clean; // no intersections

    return {
      lineStart: function() {
        stream.lineStart();
        clean = 1;
      },
      point: function(lambda1, phi1) {
        var sign1 = lambda1 > 0 ? pi$1 : -pi$1,
            delta = abs(lambda1 - lambda0);
        if (abs(delta - pi$1) < epsilon) { // line crosses a pole
          stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi$1 : -halfPi$1);
          stream.point(sign0, phi0);
          stream.lineEnd();
          stream.lineStart();
          stream.point(sign1, phi0);
          stream.point(lambda1, phi0);
          clean = 0;
        } else if (sign0 !== sign1 && delta >= pi$1) { // line crosses antimeridian
          if (abs(lambda0 - sign0) < epsilon) lambda0 -= sign0 * epsilon; // handle degeneracies
          if (abs(lambda1 - sign1) < epsilon) lambda1 -= sign1 * epsilon;
          phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
          stream.point(sign0, phi0);
          stream.lineEnd();
          stream.lineStart();
          stream.point(sign1, phi0);
          clean = 0;
        }
        stream.point(lambda0 = lambda1, phi0 = phi1);
        sign0 = sign1;
      },
      lineEnd: function() {
        stream.lineEnd();
        lambda0 = phi0 = NaN;
      },
      clean: function() {
        return 2 - clean; // if intersections, rejoin first and last segments
      }
    };
  }

  function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
    var cosPhi0,
        cosPhi1,
        sinLambda0Lambda1 = sin(lambda0 - lambda1);
    return abs(sinLambda0Lambda1) > epsilon
        ? atan((sin(phi0) * (cosPhi1 = cos(phi1)) * sin(lambda1)
            - sin(phi1) * (cosPhi0 = cos(phi0)) * sin(lambda0))
            / (cosPhi0 * cosPhi1 * sinLambda0Lambda1))
        : (phi0 + phi1) / 2;
  }

  function clipAntimeridianInterpolate(from, to, direction, stream) {
    var phi;
    if (from == null) {
      phi = direction * halfPi$1;
      stream.point(-pi$1, phi);
      stream.point(0, phi);
      stream.point(pi$1, phi);
      stream.point(pi$1, 0);
      stream.point(pi$1, -phi);
      stream.point(0, -phi);
      stream.point(-pi$1, -phi);
      stream.point(-pi$1, 0);
      stream.point(-pi$1, phi);
    } else if (abs(from[0] - to[0]) > epsilon) {
      var lambda = from[0] < to[0] ? pi$1 : -pi$1;
      phi = direction * lambda / 2;
      stream.point(-lambda, phi);
      stream.point(0, phi);
      stream.point(lambda, phi);
    } else {
      stream.point(to[0], to[1]);
    }
  }

  function clipCircle(radius) {
    var cr = cos(radius),
        delta = 6 * radians,
        smallRadius = cr > 0,
        notHemisphere = abs(cr) > epsilon; // TODO optimise for this common case

    function interpolate(from, to, direction, stream) {
      circleStream(stream, radius, delta, direction, from, to);
    }

    function visible(lambda, phi) {
      return cos(lambda) * cos(phi) > cr;
    }

    // Takes a line and cuts into visible segments. Return values used for polygon
    // clipping: 0 - there were intersections or the line was empty; 1 - no
    // intersections 2 - there were intersections, and the first and last segments
    // should be rejoined.
    function clipLine(stream) {
      var point0, // previous point
          c0, // code for previous point
          v0, // visibility of previous point
          v00, // visibility of first point
          clean; // no intersections
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(lambda, phi) {
          var point1 = [lambda, phi],
              point2,
              v = visible(lambda, phi),
              c = smallRadius
                ? v ? 0 : code(lambda, phi)
                : v ? code(lambda + (lambda < 0 ? pi$1 : -pi$1), phi) : 0;
          if (!point0 && (v00 = v0 = v)) stream.lineStart();
          // Handle degeneracies.
          // TODO ignore if not clipping polygons.
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (!point2 || pointEqual(point0, point2) || pointEqual(point1, point2)) {
              point1[0] += epsilon;
              point1[1] += epsilon;
              v = visible(point1[0], point1[1]);
            }
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              // outside going in
              stream.lineStart();
              point2 = intersect(point1, point0);
              stream.point(point2[0], point2[1]);
            } else {
              // inside going out
              point2 = intersect(point0, point1);
              stream.point(point2[0], point2[1]);
              stream.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            // If the codes for two points are different, or are both zero,
            // and there this segment intersects with the small circle.
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                stream.lineStart();
                stream.point(t[0][0], t[0][1]);
                stream.point(t[1][0], t[1][1]);
                stream.lineEnd();
              } else {
                stream.point(t[1][0], t[1][1]);
                stream.lineEnd();
                stream.lineStart();
                stream.point(t[0][0], t[0][1]);
              }
            }
          }
          if (v && (!point0 || !pointEqual(point0, point1))) {
            stream.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function() {
          if (v0) stream.lineEnd();
          point0 = null;
        },
        // Rejoin first and last segments if there were intersections and the first
        // and last points were visible.
        clean: function() {
          return clean | ((v00 && v0) << 1);
        }
      };
    }

    // Intersects the great circle between a and b with the clip circle.
    function intersect(a, b, two) {
      var pa = cartesian(a),
          pb = cartesian(b);

      // We have two planes, n1.p = d1 and n2.p = d2.
      // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
      var n1 = [1, 0, 0], // normal
          n2 = cartesianCross(pa, pb),
          n2n2 = cartesianDot(n2, n2),
          n1n2 = n2[0], // cartesianDot(n1, n2),
          determinant = n2n2 - n1n2 * n1n2;

      // Two polar points.
      if (!determinant) return !two && a;

      var c1 =  cr * n2n2 / determinant,
          c2 = -cr * n1n2 / determinant,
          n1xn2 = cartesianCross(n1, n2),
          A = cartesianScale(n1, c1),
          B = cartesianScale(n2, c2);
      cartesianAddInPlace(A, B);

      // Solve |p(t)|^2 = 1.
      var u = n1xn2,
          w = cartesianDot(A, u),
          uu = cartesianDot(u, u),
          t2 = w * w - uu * (cartesianDot(A, A) - 1);

      if (t2 < 0) return;

      var t = sqrt(t2),
          q = cartesianScale(u, (-w - t) / uu);
      cartesianAddInPlace(q, A);
      q = spherical(q);

      if (!two) return q;

      // Two intersection points.
      var lambda0 = a[0],
          lambda1 = b[0],
          phi0 = a[1],
          phi1 = b[1],
          z;

      if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;

      var delta = lambda1 - lambda0,
          polar = abs(delta - pi$1) < epsilon,
          meridian = polar || delta < epsilon;

      if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;

      // Check that the first point is between a and b.
      if (meridian
          ? polar
            ? phi0 + phi1 > 0 ^ q[1] < (abs(q[0] - lambda0) < epsilon ? phi0 : phi1)
            : phi0 <= q[1] && q[1] <= phi1
          : delta > pi$1 ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
        var q1 = cartesianScale(u, (-w + t) / uu);
        cartesianAddInPlace(q1, A);
        return [q, spherical(q1)];
      }
    }

    // Generates a 4-bit vector representing the location of a point relative to
    // the small circle's bounding box.
    function code(lambda, phi) {
      var r = smallRadius ? radius : pi$1 - radius,
          code = 0;
      if (lambda < -r) code |= 1; // left
      else if (lambda > r) code |= 2; // right
      if (phi < -r) code |= 4; // below
      else if (phi > r) code |= 8; // above
      return code;
    }

    return clip(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi$1, radius - pi$1]);
  }

  function clipLine(a, b, x0, y0, x1, y1) {
    var ax = a[0],
        ay = a[1],
        bx = b[0],
        by = b[1],
        t0 = 0,
        t1 = 1,
        dx = bx - ax,
        dy = by - ay,
        r;

    r = x0 - ax;
    if (!dx && r > 0) return;
    r /= dx;
    if (dx < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dx > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }

    r = x1 - ax;
    if (!dx && r < 0) return;
    r /= dx;
    if (dx < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dx > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }

    r = y0 - ay;
    if (!dy && r > 0) return;
    r /= dy;
    if (dy < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dy > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }

    r = y1 - ay;
    if (!dy && r < 0) return;
    r /= dy;
    if (dy < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dy > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }

    if (t0 > 0) a[0] = ax + t0 * dx, a[1] = ay + t0 * dy;
    if (t1 < 1) b[0] = ax + t1 * dx, b[1] = ay + t1 * dy;
    return true;
  }

  var clipMax = 1e9, clipMin = -clipMax;

  // TODO Use d3-polygon’s polygonContains here for the ring check?
  // TODO Eliminate duplicate buffering in clipBuffer and polygon.push?

  function clipRectangle(x0, y0, x1, y1) {

    function visible(x, y) {
      return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }

    function interpolate(from, to, direction, stream) {
      var a = 0, a1 = 0;
      if (from == null
          || (a = corner(from, direction)) !== (a1 = corner(to, direction))
          || comparePoint(from, to) < 0 ^ direction > 0) {
        do stream.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
        while ((a = (a + direction + 4) % 4) !== a1);
      } else {
        stream.point(to[0], to[1]);
      }
    }

    function corner(p, direction) {
      return abs(p[0] - x0) < epsilon ? direction > 0 ? 0 : 3
          : abs(p[0] - x1) < epsilon ? direction > 0 ? 2 : 1
          : abs(p[1] - y0) < epsilon ? direction > 0 ? 1 : 0
          : direction > 0 ? 3 : 2; // abs(p[1] - y1) < epsilon
    }

    function compareIntersection(a, b) {
      return comparePoint(a.x, b.x);
    }

    function comparePoint(a, b) {
      var ca = corner(a, 1),
          cb = corner(b, 1);
      return ca !== cb ? ca - cb
          : ca === 0 ? b[1] - a[1]
          : ca === 1 ? a[0] - b[0]
          : ca === 2 ? a[1] - b[1]
          : b[0] - a[0];
    }

    return function(stream) {
      var activeStream = stream,
          bufferStream = clipBuffer(),
          segments,
          polygon,
          ring,
          x__, y__, v__, // first point
          x_, y_, v_, // previous point
          first,
          clean;

      var clipStream = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: polygonStart,
        polygonEnd: polygonEnd
      };

      function point(x, y) {
        if (visible(x, y)) activeStream.point(x, y);
      }

      function polygonInside() {
        var winding = 0;

        for (var i = 0, n = polygon.length; i < n; ++i) {
          for (var ring = polygon[i], j = 1, m = ring.length, point = ring[0], a0, a1, b0 = point[0], b1 = point[1]; j < m; ++j) {
            a0 = b0, a1 = b1, point = ring[j], b0 = point[0], b1 = point[1];
            if (a1 <= y1) { if (b1 > y1 && (b0 - a0) * (y1 - a1) > (b1 - a1) * (x0 - a0)) ++winding; }
            else { if (b1 <= y1 && (b0 - a0) * (y1 - a1) < (b1 - a1) * (x0 - a0)) --winding; }
          }
        }

        return winding;
      }

      // Buffer geometry within a polygon and then clip it en masse.
      function polygonStart() {
        activeStream = bufferStream, segments = [], polygon = [], clean = true;
      }

      function polygonEnd() {
        var startInside = polygonInside(),
            cleanInside = clean && startInside,
            visible = (segments = merge(segments)).length;
        if (cleanInside || visible) {
          stream.polygonStart();
          if (cleanInside) {
            stream.lineStart();
            interpolate(null, null, 1, stream);
            stream.lineEnd();
          }
          if (visible) {
            clipRejoin(segments, compareIntersection, startInside, interpolate, stream);
          }
          stream.polygonEnd();
        }
        activeStream = stream, segments = polygon = ring = null;
      }

      function lineStart() {
        clipStream.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }

      // TODO rather than special-case polygons, simply handle them separately.
      // Ideally, coincident intersection points should be jittered to avoid
      // clipping issues.
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferStream.rejoin();
          segments.push(bufferStream.result());
        }
        clipStream.point = point;
        if (v_) activeStream.lineEnd();
      }

      function linePoint(x, y) {
        var v = visible(x, y);
        if (polygon) ring.push([x, y]);
        if (first) {
          x__ = x, y__ = y, v__ = v;
          first = false;
          if (v) {
            activeStream.lineStart();
            activeStream.point(x, y);
          }
        } else {
          if (v && v_) activeStream.point(x, y);
          else {
            var a = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))],
                b = [x = Math.max(clipMin, Math.min(clipMax, x)), y = Math.max(clipMin, Math.min(clipMax, y))];
            if (clipLine(a, b, x0, y0, x1, y1)) {
              if (!v_) {
                activeStream.lineStart();
                activeStream.point(a[0], a[1]);
              }
              activeStream.point(b[0], b[1]);
              if (!v) activeStream.lineEnd();
              clean = false;
            } else if (v) {
              activeStream.lineStart();
              activeStream.point(x, y);
              clean = false;
            }
          }
        }
        x_ = x, y_ = y, v_ = v;
      }

      return clipStream;
    };
  }

  var lengthSum = adder();

  function identity$2(x) {
    return x;
  }

  var areaSum$1 = adder(),
      areaRingSum$1 = adder(),
      x00,
      y00,
      x0$1,
      y0$1;

  var areaStream$1 = {
    point: noop$1,
    lineStart: noop$1,
    lineEnd: noop$1,
    polygonStart: function() {
      areaStream$1.lineStart = areaRingStart$1;
      areaStream$1.lineEnd = areaRingEnd$1;
    },
    polygonEnd: function() {
      areaStream$1.lineStart = areaStream$1.lineEnd = areaStream$1.point = noop$1;
      areaSum$1.add(abs(areaRingSum$1));
      areaRingSum$1.reset();
    },
    result: function() {
      var area = areaSum$1 / 2;
      areaSum$1.reset();
      return area;
    }
  };

  function areaRingStart$1() {
    areaStream$1.point = areaPointFirst$1;
  }

  function areaPointFirst$1(x, y) {
    areaStream$1.point = areaPoint$1;
    x00 = x0$1 = x, y00 = y0$1 = y;
  }

  function areaPoint$1(x, y) {
    areaRingSum$1.add(y0$1 * x - x0$1 * y);
    x0$1 = x, y0$1 = y;
  }

  function areaRingEnd$1() {
    areaPoint$1(x00, y00);
  }

  var x0$2 = Infinity,
      y0$2 = x0$2,
      x1 = -x0$2,
      y1 = x1;

  var boundsStream$1 = {
    point: boundsPoint$1,
    lineStart: noop$1,
    lineEnd: noop$1,
    polygonStart: noop$1,
    polygonEnd: noop$1,
    result: function() {
      var bounds = [[x0$2, y0$2], [x1, y1]];
      x1 = y1 = -(y0$2 = x0$2 = Infinity);
      return bounds;
    }
  };

  function boundsPoint$1(x, y) {
    if (x < x0$2) x0$2 = x;
    if (x > x1) x1 = x;
    if (y < y0$2) y0$2 = y;
    if (y > y1) y1 = y;
  }

  // TODO Enforce positive area for exterior, negative area for interior?

  var X0$1 = 0,
      Y0$1 = 0,
      Z0$1 = 0,
      X1$1 = 0,
      Y1$1 = 0,
      Z1$1 = 0,
      X2$1 = 0,
      Y2$1 = 0,
      Z2$1 = 0,
      x00$1,
      y00$1,
      x0$3,
      y0$3;

  var centroidStream$1 = {
    point: centroidPoint$1,
    lineStart: centroidLineStart$1,
    lineEnd: centroidLineEnd$1,
    polygonStart: function() {
      centroidStream$1.lineStart = centroidRingStart$1;
      centroidStream$1.lineEnd = centroidRingEnd$1;
    },
    polygonEnd: function() {
      centroidStream$1.point = centroidPoint$1;
      centroidStream$1.lineStart = centroidLineStart$1;
      centroidStream$1.lineEnd = centroidLineEnd$1;
    },
    result: function() {
      var centroid = Z2$1 ? [X2$1 / Z2$1, Y2$1 / Z2$1]
          : Z1$1 ? [X1$1 / Z1$1, Y1$1 / Z1$1]
          : Z0$1 ? [X0$1 / Z0$1, Y0$1 / Z0$1]
          : [NaN, NaN];
      X0$1 = Y0$1 = Z0$1 =
      X1$1 = Y1$1 = Z1$1 =
      X2$1 = Y2$1 = Z2$1 = 0;
      return centroid;
    }
  };

  function centroidPoint$1(x, y) {
    X0$1 += x;
    Y0$1 += y;
    ++Z0$1;
  }

  function centroidLineStart$1() {
    centroidStream$1.point = centroidPointFirstLine;
  }

  function centroidPointFirstLine(x, y) {
    centroidStream$1.point = centroidPointLine;
    centroidPoint$1(x0$3 = x, y0$3 = y);
  }

  function centroidPointLine(x, y) {
    var dx = x - x0$3, dy = y - y0$3, z = sqrt(dx * dx + dy * dy);
    X1$1 += z * (x0$3 + x) / 2;
    Y1$1 += z * (y0$3 + y) / 2;
    Z1$1 += z;
    centroidPoint$1(x0$3 = x, y0$3 = y);
  }

  function centroidLineEnd$1() {
    centroidStream$1.point = centroidPoint$1;
  }

  function centroidRingStart$1() {
    centroidStream$1.point = centroidPointFirstRing;
  }

  function centroidRingEnd$1() {
    centroidPointRing(x00$1, y00$1);
  }

  function centroidPointFirstRing(x, y) {
    centroidStream$1.point = centroidPointRing;
    centroidPoint$1(x00$1 = x0$3 = x, y00$1 = y0$3 = y);
  }

  function centroidPointRing(x, y) {
    var dx = x - x0$3,
        dy = y - y0$3,
        z = sqrt(dx * dx + dy * dy);

    X1$1 += z * (x0$3 + x) / 2;
    Y1$1 += z * (y0$3 + y) / 2;
    Z1$1 += z;

    z = y0$3 * x - x0$3 * y;
    X2$1 += z * (x0$3 + x);
    Y2$1 += z * (y0$3 + y);
    Z2$1 += z * 3;
    centroidPoint$1(x0$3 = x, y0$3 = y);
  }

  function PathContext(context) {
    this._context = context;
  }

  PathContext.prototype = {
    _radius: 4.5,
    pointRadius: function(_) {
      return this._radius = _, this;
    },
    polygonStart: function() {
      this._line = 0;
    },
    polygonEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._point = 0;
    },
    lineEnd: function() {
      if (this._line === 0) this._context.closePath();
      this._point = NaN;
    },
    point: function(x, y) {
      switch (this._point) {
        case 0: {
          this._context.moveTo(x, y);
          this._point = 1;
          break;
        }
        case 1: {
          this._context.lineTo(x, y);
          break;
        }
        default: {
          this._context.moveTo(x + this._radius, y);
          this._context.arc(x, y, this._radius, 0, tau$1);
          break;
        }
      }
    },
    result: noop$1
  };

  var lengthSum$1 = adder(),
      lengthRing,
      x00$2,
      y00$2,
      x0$4,
      y0$4;

  var lengthStream$1 = {
    point: noop$1,
    lineStart: function() {
      lengthStream$1.point = lengthPointFirst$1;
    },
    lineEnd: function() {
      if (lengthRing) lengthPoint$1(x00$2, y00$2);
      lengthStream$1.point = noop$1;
    },
    polygonStart: function() {
      lengthRing = true;
    },
    polygonEnd: function() {
      lengthRing = null;
    },
    result: function() {
      var length = +lengthSum$1;
      lengthSum$1.reset();
      return length;
    }
  };

  function lengthPointFirst$1(x, y) {
    lengthStream$1.point = lengthPoint$1;
    x00$2 = x0$4 = x, y00$2 = y0$4 = y;
  }

  function lengthPoint$1(x, y) {
    x0$4 -= x, y0$4 -= y;
    lengthSum$1.add(sqrt(x0$4 * x0$4 + y0$4 * y0$4));
    x0$4 = x, y0$4 = y;
  }

  function PathString() {
    this._string = [];
  }

  PathString.prototype = {
    _radius: 4.5,
    _circle: circle$1(4.5),
    pointRadius: function(_) {
      if ((_ = +_) !== this._radius) this._radius = _, this._circle = null;
      return this;
    },
    polygonStart: function() {
      this._line = 0;
    },
    polygonEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._point = 0;
    },
    lineEnd: function() {
      if (this._line === 0) this._string.push("Z");
      this._point = NaN;
    },
    point: function(x, y) {
      switch (this._point) {
        case 0: {
          this._string.push("M", x, ",", y);
          this._point = 1;
          break;
        }
        case 1: {
          this._string.push("L", x, ",", y);
          break;
        }
        default: {
          if (this._circle == null) this._circle = circle$1(this._radius);
          this._string.push("M", x, ",", y, this._circle);
          break;
        }
      }
    },
    result: function() {
      if (this._string.length) {
        var result = this._string.join("");
        this._string = [];
        return result;
      } else {
        return null;
      }
    }
  };

  function circle$1(radius) {
    return "m0," + radius
        + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius
        + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius
        + "z";
  }

  function index(projection, context) {
    var pointRadius = 4.5,
        projectionStream,
        contextStream;

    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        geoStream(object, projectionStream(contextStream));
      }
      return contextStream.result();
    }

    path.area = function(object) {
      geoStream(object, projectionStream(areaStream$1));
      return areaStream$1.result();
    };

    path.measure = function(object) {
      geoStream(object, projectionStream(lengthStream$1));
      return lengthStream$1.result();
    };

    path.bounds = function(object) {
      geoStream(object, projectionStream(boundsStream$1));
      return boundsStream$1.result();
    };

    path.centroid = function(object) {
      geoStream(object, projectionStream(centroidStream$1));
      return centroidStream$1.result();
    };

    path.projection = function(_) {
      return arguments.length ? (projectionStream = _ == null ? (projection = null, identity$2) : (projection = _).stream, path) : projection;
    };

    path.context = function(_) {
      if (!arguments.length) return context;
      contextStream = _ == null ? (context = null, new PathString) : new PathContext(context = _);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return path;
    };

    path.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path;
    };

    return path.projection(projection).context(context);
  }

  function transformer(methods) {
    return function(stream) {
      var s = new TransformStream;
      for (var key in methods) s[key] = methods[key];
      s.stream = stream;
      return s;
    };
  }

  function TransformStream() {}

  TransformStream.prototype = {
    constructor: TransformStream,
    point: function(x, y) { this.stream.point(x, y); },
    sphere: function() { this.stream.sphere(); },
    lineStart: function() { this.stream.lineStart(); },
    lineEnd: function() { this.stream.lineEnd(); },
    polygonStart: function() { this.stream.polygonStart(); },
    polygonEnd: function() { this.stream.polygonEnd(); }
  };

  function fit(projection, fitBounds, object) {
    var clip = projection.clipExtent && projection.clipExtent();
    projection.scale(150).translate([0, 0]);
    if (clip != null) projection.clipExtent(null);
    geoStream(object, projection.stream(boundsStream$1));
    fitBounds(boundsStream$1.result());
    if (clip != null) projection.clipExtent(clip);
    return projection;
  }

  function fitExtent(projection, extent, object) {
    return fit(projection, function(b) {
      var w = extent[1][0] - extent[0][0],
          h = extent[1][1] - extent[0][1],
          k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
          x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
          y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;
      projection.scale(150 * k).translate([x, y]);
    }, object);
  }

  function fitSize(projection, size, object) {
    return fitExtent(projection, [[0, 0], size], object);
  }

  function fitWidth(projection, width, object) {
    return fit(projection, function(b) {
      var w = +width,
          k = w / (b[1][0] - b[0][0]),
          x = (w - k * (b[1][0] + b[0][0])) / 2,
          y = -k * b[0][1];
      projection.scale(150 * k).translate([x, y]);
    }, object);
  }

  function fitHeight(projection, height, object) {
    return fit(projection, function(b) {
      var h = +height,
          k = h / (b[1][1] - b[0][1]),
          x = -k * b[0][0],
          y = (h - k * (b[1][1] + b[0][1])) / 2;
      projection.scale(150 * k).translate([x, y]);
    }, object);
  }

  var maxDepth = 16, // maximum depth of subdivision
      cosMinDistance = cos(30 * radians); // cos(minimum angular distance)

  function resample(project, delta2) {
    return +delta2 ? resample$1(project, delta2) : resampleNone(project);
  }

  function resampleNone(project) {
    return transformer({
      point: function(x, y) {
        x = project(x, y);
        this.stream.point(x[0], x[1]);
      }
    });
  }

  function resample$1(project, delta2) {

    function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0,
          dy = y1 - y0,
          d2 = dx * dx + dy * dy;
      if (d2 > 4 * delta2 && depth--) {
        var a = a0 + a1,
            b = b0 + b1,
            c = c0 + c1,
            m = sqrt(a * a + b * b + c * c),
            phi2 = asin(c /= m),
            lambda2 = abs(abs(c) - 1) < epsilon || abs(lambda0 - lambda1) < epsilon ? (lambda0 + lambda1) / 2 : atan2(b, a),
            p = project(lambda2, phi2),
            x2 = p[0],
            y2 = p[1],
            dx2 = x2 - x0,
            dy2 = y2 - y0,
            dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > delta2 // perpendicular projected distance
            || abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 // midpoint close to an end
            || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) { // angular distance
          resampleLineTo(x0, y0, lambda0, a0, b0, c0, x2, y2, lambda2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, lambda2, a, b, c, x1, y1, lambda1, a1, b1, c1, depth, stream);
        }
      }
    }
    return function(stream) {
      var lambda00, x00, y00, a00, b00, c00, // first point
          lambda0, x0, y0, a0, b0, c0; // previous point

      var resampleStream = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() { stream.polygonStart(); resampleStream.lineStart = ringStart; },
        polygonEnd: function() { stream.polygonEnd(); resampleStream.lineStart = lineStart; }
      };

      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }

      function lineStart() {
        x0 = NaN;
        resampleStream.point = linePoint;
        stream.lineStart();
      }

      function linePoint(lambda, phi) {
        var c = cartesian([lambda, phi]), p = project(lambda, phi);
        resampleLineTo(x0, y0, lambda0, a0, b0, c0, x0 = p[0], y0 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }

      function lineEnd() {
        resampleStream.point = point;
        stream.lineEnd();
      }

      function ringStart() {
        lineStart();
        resampleStream.point = ringPoint;
        resampleStream.lineEnd = ringEnd;
      }

      function ringPoint(lambda, phi) {
        linePoint(lambda00 = lambda, phi), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
        resampleStream.point = linePoint;
      }

      function ringEnd() {
        resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream);
        resampleStream.lineEnd = lineEnd;
        lineEnd();
      }

      return resampleStream;
    };
  }

  var transformRadians = transformer({
    point: function(x, y) {
      this.stream.point(x * radians, y * radians);
    }
  });

  function transformRotate(rotate) {
    return transformer({
      point: function(x, y) {
        var r = rotate(x, y);
        return this.stream.point(r[0], r[1]);
      }
    });
  }

  function scaleTranslate(k, dx, dy) {
    function transform$$1(x, y) {
      return [dx + k * x, dy - k * y];
    }
    transform$$1.invert = function(x, y) {
      return [(x - dx) / k, (dy - y) / k];
    };
    return transform$$1;
  }

  function scaleTranslateRotate(k, dx, dy, alpha) {
    var cosAlpha = cos(alpha),
        sinAlpha = sin(alpha),
        a = cosAlpha * k,
        b = sinAlpha * k,
        ai = cosAlpha / k,
        bi = sinAlpha / k,
        ci = (sinAlpha * dy - cosAlpha * dx) / k,
        fi = (sinAlpha * dx + cosAlpha * dy) / k;
    function transform$$1(x, y) {
      return [a * x - b * y + dx, dy - b * x - a * y];
    }
    transform$$1.invert = function(x, y) {
      return [ai * x - bi * y + ci, fi - bi * x - ai * y];
    };
    return transform$$1;
  }

  function projection(project) {
    return projectionMutator(function() { return project; })();
  }

  function projectionMutator(projectAt) {
    var project,
        k = 150, // scale
        x = 480, y = 250, // translate
        lambda = 0, phi = 0, // center
        deltaLambda = 0, deltaPhi = 0, deltaGamma = 0, rotate, // pre-rotate
        alpha = 0, // post-rotate
        theta = null, preclip = clipAntimeridian, // pre-clip angle
        x0 = null, y0, x1, y1, postclip = identity$2, // post-clip extent
        delta2 = 0.5, // precision
        projectResample,
        projectTransform,
        projectRotateTransform,
        cache,
        cacheStream;

    function projection(point) {
      return projectRotateTransform(point[0] * radians, point[1] * radians);
    }

    function invert(point) {
      point = projectRotateTransform.invert(point[0], point[1]);
      return point && [point[0] * degrees$1, point[1] * degrees$1];
    }

    projection.stream = function(stream) {
      return cache && cacheStream === stream ? cache : cache = transformRadians(transformRotate(rotate)(preclip(projectResample(postclip(cacheStream = stream)))));
    };

    projection.preclip = function(_) {
      return arguments.length ? (preclip = _, theta = undefined, reset()) : preclip;
    };

    projection.postclip = function(_) {
      return arguments.length ? (postclip = _, x0 = y0 = x1 = y1 = null, reset()) : postclip;
    };

    projection.clipAngle = function(_) {
      return arguments.length ? (preclip = +_ ? clipCircle(theta = _ * radians) : (theta = null, clipAntimeridian), reset()) : theta * degrees$1;
    };

    projection.clipExtent = function(_) {
      return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity$2) : clipRectangle(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
    };

    projection.scale = function(_) {
      return arguments.length ? (k = +_, recenter()) : k;
    };

    projection.translate = function(_) {
      return arguments.length ? (x = +_[0], y = +_[1], recenter()) : [x, y];
    };

    projection.center = function(_) {
      return arguments.length ? (lambda = _[0] % 360 * radians, phi = _[1] % 360 * radians, recenter()) : [lambda * degrees$1, phi * degrees$1];
    };

    projection.rotate = function(_) {
      return arguments.length ? (deltaLambda = _[0] % 360 * radians, deltaPhi = _[1] % 360 * radians, deltaGamma = _.length > 2 ? _[2] % 360 * radians : 0, recenter()) : [deltaLambda * degrees$1, deltaPhi * degrees$1, deltaGamma * degrees$1];
    };

    projection.angle = function(_) {
      return arguments.length ? (alpha = _ % 360 * radians, recenter()) : alpha * degrees$1;
    };

    projection.precision = function(_) {
      return arguments.length ? (projectResample = resample(projectTransform, delta2 = _ * _), reset()) : sqrt(delta2);
    };

    projection.fitExtent = function(extent, object) {
      return fitExtent(projection, extent, object);
    };

    projection.fitSize = function(size, object) {
      return fitSize(projection, size, object);
    };

    projection.fitWidth = function(width, object) {
      return fitWidth(projection, width, object);
    };

    projection.fitHeight = function(height, object) {
      return fitHeight(projection, height, object);
    };

    function recenter() {
      var center = scaleTranslateRotate(k, 0, 0, alpha).apply(null, project(lambda, phi)),
          transform$$1 = (alpha ? scaleTranslateRotate : scaleTranslate)(k, x - center[0], y - center[1], alpha);
      rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma);
      projectTransform = compose(project, transform$$1);
      projectRotateTransform = compose(rotate, projectTransform);
      projectResample = resample(projectTransform, delta2);
      return reset();
    }

    function reset() {
      cache = cacheStream = null;
      return projection;
    }

    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return recenter();
    };
  }

  function mercatorRaw(lambda, phi) {
    return [lambda, log(tan((halfPi$1 + phi) / 2))];
  }

  mercatorRaw.invert = function(x, y) {
    return [x, 2 * atan(exp(y)) - halfPi$1];
  };

  function mercator() {
    return mercatorProjection(mercatorRaw)
        .scale(961 / tau$1);
  }

  function mercatorProjection(project) {
    var m = projection(project),
        center = m.center,
        scale = m.scale,
        translate = m.translate,
        clipExtent = m.clipExtent,
        x0 = null, y0, x1, y1; // clip extent

    m.scale = function(_) {
      return arguments.length ? (scale(_), reclip()) : scale();
    };

    m.translate = function(_) {
      return arguments.length ? (translate(_), reclip()) : translate();
    };

    m.center = function(_) {
      return arguments.length ? (center(_), reclip()) : center();
    };

    m.clipExtent = function(_) {
      return arguments.length ? (_ == null ? x0 = y0 = x1 = y1 = null : (x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reclip()) : x0 == null ? null : [[x0, y0], [x1, y1]];
    };

    function reclip() {
      var k = pi$1 * scale(),
          t = m(rotation(m.rotate()).invert([0, 0]));
      return clipExtent(x0 == null
          ? [[t[0] - k, t[1] - k], [t[0] + k, t[1] + k]] : project === mercatorRaw
          ? [[Math.max(t[0] - k, x0), y0], [Math.min(t[0] + k, x1), y1]]
          : [[x0, Math.max(t[1] - k, y0)], [x1, Math.min(t[1] + k, y1)]]);
    }

    return reclip();
  }

  function geometry(data, key){
  	// if no data is passed, then this is a getter function
  	if (!data) {
  		return this.data.geo;
  	}

  	// if data is passed, then this is a setter function
  	this.data.geo = data;

  	// if a key is passed, add the key to the data
  	if (key){

  		var arr = this.data.geo.objects[Object.keys(this.data.geo.objects)[0]].geometries,
  			out = [];
  		for (var i = 0, n = arr.length; i < n; i++){
  			arr[i].properties.key = key(arr[i]);
  			out.push(arr[i]);
  		}
  		this.data.geo.objects[Object.keys(this.data.geo.objects)[0]].geometries = out;

  	}
    
    return this;
  }

  function data(data, key){
  	// if no data is passed, then this is a getter function
  	if (!data) {
  		return this.data.tab;
  	}

  	// if data is passed, then this is a setter function
  	this.data.tab = data;

  	// if a key is passed, add the key to the data
  	if (key){

  		// for loops are more efficient that forEach
  		var arr = this.data.tab,
  			out = [];
  		for (var i = 0, n = arr.length; i < n; i++){
  			arr[i].key = key(arr[i]);
  			out.push(arr[i]);
  		}
  		this.data.tab = out;

  	}
    
    return this;
  }

  function colorScheme(options){
  	// if no options are passed, this is a getter function
  	if (!options) {
  		return this.data.colorScheme;
  	}

  	// if data is passed, then this is a setter function
  	this.data.colorScheme = options;
    
    return this;
  }

  function draw(){

  	// check for geospatial data
  	if (this.data.geo.length == 0) throw Error("You must pass TopoJSON data through swiftmap.geometry() before you can draw the map.");

  	// basic drawing
    this.fitSize().drawSubunits().drawBoundary();

    return this;
  }

  function identity$4(x) {
    return x;
  }

  function transform$1(transform) {
    if (transform == null) return identity$4;
    var x0,
        y0,
        kx = transform.scale[0],
        ky = transform.scale[1],
        dx = transform.translate[0],
        dy = transform.translate[1];
    return function(input, i) {
      if (!i) x0 = y0 = 0;
      var j = 2, n = input.length, output = new Array(n);
      output[0] = (x0 += input[0]) * kx + dx;
      output[1] = (y0 += input[1]) * ky + dy;
      while (j < n) output[j] = input[j], ++j;
      return output;
    };
  }

  function reverse(array, n) {
    var t, j = array.length, i = j - n;
    while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
  }

  function feature(topology, o) {
    return o.type === "GeometryCollection"
        ? {type: "FeatureCollection", features: o.geometries.map(function(o) { return feature$1(topology, o); })}
        : feature$1(topology, o);
  }

  function feature$1(topology, o) {
    var id = o.id,
        bbox = o.bbox,
        properties = o.properties == null ? {} : o.properties,
        geometry = object$2(topology, o);
    return id == null && bbox == null ? {type: "Feature", properties: properties, geometry: geometry}
        : bbox == null ? {type: "Feature", id: id, properties: properties, geometry: geometry}
        : {type: "Feature", id: id, bbox: bbox, properties: properties, geometry: geometry};
  }

  function object$2(topology, o) {
    var transformPoint = transform$1(topology.transform),
        arcs = topology.arcs;

    function arc(i, points) {
      if (points.length) points.pop();
      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
        points.push(transformPoint(a[k], k));
      }
      if (i < 0) reverse(points, n);
    }

    function point(p) {
      return transformPoint(p);
    }

    function line(arcs) {
      var points = [];
      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
      if (points.length < 2) points.push(points[0]); // This should never happen per the specification.
      return points;
    }

    function ring(arcs) {
      var points = line(arcs);
      while (points.length < 4) points.push(points[0]); // This may happen if an arc has only two points.
      return points;
    }

    function polygon(arcs) {
      return arcs.map(ring);
    }

    function geometry(o) {
      var type = o.type, coordinates;
      switch (type) {
        case "GeometryCollection": return {type: type, geometries: o.geometries.map(geometry)};
        case "Point": coordinates = point(o.coordinates); break;
        case "MultiPoint": coordinates = o.coordinates.map(point); break;
        case "LineString": coordinates = line(o.arcs); break;
        case "MultiLineString": coordinates = o.arcs.map(line); break;
        case "Polygon": coordinates = polygon(o.arcs); break;
        case "MultiPolygon": coordinates = o.arcs.map(polygon); break;
        default: return null;
      }
      return {type: type, coordinates: coordinates};
    }

    return geometry(o);
  }

  function stitch(topology, arcs) {
    var stitchedArcs = {},
        fragmentByStart = {},
        fragmentByEnd = {},
        fragments = [],
        emptyIndex = -1;

    // Stitch empty arcs first, since they may be subsumed by other arcs.
    arcs.forEach(function(i, j) {
      var arc = topology.arcs[i < 0 ? ~i : i], t;
      if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
        t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
      }
    });

    arcs.forEach(function(i) {
      var e = ends(i),
          start = e[0],
          end = e[1],
          f, g;

      if (f = fragmentByEnd[start]) {
        delete fragmentByEnd[f.end];
        f.push(i);
        f.end = end;
        if (g = fragmentByStart[end]) {
          delete fragmentByStart[g.start];
          var fg = g === f ? f : f.concat(g);
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByStart[end]) {
        delete fragmentByStart[f.start];
        f.unshift(i);
        f.start = start;
        if (g = fragmentByEnd[start]) {
          delete fragmentByEnd[g.end];
          var gf = g === f ? f : g.concat(f);
          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else {
        f = [i];
        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
      }
    });

    function ends(i) {
      var arc = topology.arcs[i < 0 ? ~i : i], p0 = arc[0], p1;
      if (topology.transform) p1 = [0, 0], arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });
      else p1 = arc[arc.length - 1];
      return i < 0 ? [p1, p0] : [p0, p1];
    }

    function flush(fragmentByEnd, fragmentByStart) {
      for (var k in fragmentByEnd) {
        var f = fragmentByEnd[k];
        delete fragmentByStart[f.start];
        delete f.start;
        delete f.end;
        f.forEach(function(i) { stitchedArcs[i < 0 ? ~i : i] = 1; });
        fragments.push(f);
      }
    }

    flush(fragmentByEnd, fragmentByStart);
    flush(fragmentByStart, fragmentByEnd);
    arcs.forEach(function(i) { if (!stitchedArcs[i < 0 ? ~i : i]) fragments.push([i]); });

    return fragments;
  }

  function mesh(topology) {
    return object$2(topology, meshArcs.apply(this, arguments));
  }

  function meshArcs(topology, object, filter) {
    var arcs, i, n;
    if (arguments.length > 1) arcs = extractArcs(topology, object, filter);
    else for (i = 0, arcs = new Array(n = topology.arcs.length); i < n; ++i) arcs[i] = i;
    return {type: "MultiLineString", arcs: stitch(topology, arcs)};
  }

  function extractArcs(topology, object, filter) {
    var arcs = [],
        geomsByArc = [],
        geom;

    function extract0(i) {
      var j = i < 0 ? ~i : i;
      (geomsByArc[j] || (geomsByArc[j] = [])).push({i: i, g: geom});
    }

    function extract1(arcs) {
      arcs.forEach(extract0);
    }

    function extract2(arcs) {
      arcs.forEach(extract1);
    }

    function extract3(arcs) {
      arcs.forEach(extract2);
    }

    function geometry(o) {
      switch (geom = o, o.type) {
        case "GeometryCollection": o.geometries.forEach(geometry); break;
        case "LineString": extract1(o.arcs); break;
        case "MultiLineString": case "Polygon": extract2(o.arcs); break;
        case "MultiPolygon": extract3(o.arcs); break;
      }
    }

    geometry(object);

    geomsByArc.forEach(filter == null
        ? function(geoms) { arcs.push(geoms[0].i); }
        : function(geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i); });

    return arcs;
  }

  // draws an outer boundary
  function drawBoundary() {
  	// check for geospatial data
  	if (this.data.geo.length == 0) throw Error("You must pass TopoJSON data through swiftmap.geometry() before you can draw a boundary.");
  	
    var data_object = this.data.geo.objects[Object.keys(this.data.geo.objects)[0]];
    
    this.boundary = this.svg.append("path")
      .datum(mesh(this.data.geo, data_object, function(a, b) { return a === b; }))
      .attr("d", this.path)
      .attr("class", "boundary")
      .attr("stroke", "#000")
      .attr("fill", "none");

    return this;
  }

  // modules

  // draws subunits
  function drawSubunits() {
    // check for geospatial data
    if (this.data.geo.length == 0) throw Error("You must pass TopoJSON data through swiftmap.geometry() before you can draw subunits.");

    var data_object = this.data.geo.objects[Object.keys(this.data.geo.objects)[0]];
    
    this.subunits = this.svg.selectAll(".subunit")
        .data(feature(this.data.geo, data_object).features, function(d, i){ return i; })
      .enter().append("path")
        .attr("class", "subunit")
        .attr("d", this.path)
        .attr("stroke", "#fff")
        .attr("stroke-width", "1px")
        .attr("fill", "#ccc");

    return this;
  }

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var chroma = createCommonjsModule(function (module, exports) {
  /**
   * @license
   *
   * chroma.js - JavaScript library for color conversions
   * 
   * Copyright (c) 2011-2017, Gregor Aisch
   * All rights reserved.
   * 
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   * 
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the documentation
   *    and/or other materials provided with the distribution.
   * 
   * 3. The name Gregor Aisch may not be used to endorse or promote products
   *    derived from this software without specific prior written permission.
   * 
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
   * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
   * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
   * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
   * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
   * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
   * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
   * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *
   */

  (function() {
    var Color, DEG2RAD, LAB_CONSTANTS, PI, PITHIRD, RAD2DEG, TWOPI, _average_lrgb, _guess_formats, _guess_formats_sorted, _input, _interpolators, abs, atan2, bezier, blend, blend_f, brewer, burn, chroma, clip_rgb, cmyk2rgb, colors, cos, css2rgb, darken, dodge, each, floor, hcg2rgb, hex2rgb, hsi2rgb, hsl2css, hsl2rgb, hsv2rgb, interpolate, interpolate_hsx, interpolate_lab, interpolate_lrgb, interpolate_num, interpolate_rgb, lab2lch, lab2rgb, lab_xyz, lch2lab, lch2rgb, lighten, limit, log, luminance_x, m, max, multiply, normal, num2rgb, overlay, pow, rgb2cmyk, rgb2css, rgb2hcg, rgb2hex, rgb2hsi, rgb2hsl, rgb2hsv, rgb2lab, rgb2lch, rgb2luminance, rgb2num, rgb2temperature, rgb2xyz, rgb_xyz, rnd, root, round, screen, sin, sqrt, temperature2rgb, type, unpack, w3cx11, xyz_lab, xyz_rgb,
      slice = [].slice;

    type = (function() {

      /*
      for browser-safe type checking+
      ported from jQuery's $.type
       */
      var classToType, len, name, o, ref;
      classToType = {};
      ref = "Boolean Number String Function Array Date RegExp Undefined Null".split(" ");
      for (o = 0, len = ref.length; o < len; o++) {
        name = ref[o];
        classToType["[object " + name + "]"] = name.toLowerCase();
      }
      return function(obj) {
        var strType;
        strType = Object.prototype.toString.call(obj);
        return classToType[strType] || "object";
      };
    })();

    limit = function(x, min, max) {
      if (min == null) {
        min = 0;
      }
      if (max == null) {
        max = 1;
      }
      if (x < min) {
        x = min;
      }
      if (x > max) {
        x = max;
      }
      return x;
    };

    unpack = function(args) {
      if (args.length >= 3) {
        return [].slice.call(args);
      } else {
        return args[0];
      }
    };

    clip_rgb = function(rgb) {
      var i, o;
      rgb._clipped = false;
      rgb._unclipped = rgb.slice(0);
      for (i = o = 0; o < 3; i = ++o) {
        if (i < 3) {
          if (rgb[i] < 0 || rgb[i] > 255) {
            rgb._clipped = true;
          }
          if (rgb[i] < 0) {
            rgb[i] = 0;
          }
          if (rgb[i] > 255) {
            rgb[i] = 255;
          }
        } else if (i === 3) {
          if (rgb[i] < 0) {
            rgb[i] = 0;
          }
          if (rgb[i] > 1) {
            rgb[i] = 1;
          }
        }
      }
      if (!rgb._clipped) {
        delete rgb._unclipped;
      }
      return rgb;
    };

    PI = Math.PI, round = Math.round, cos = Math.cos, floor = Math.floor, pow = Math.pow, log = Math.log, sin = Math.sin, sqrt = Math.sqrt, atan2 = Math.atan2, max = Math.max, abs = Math.abs;

    TWOPI = PI * 2;

    PITHIRD = PI / 3;

    DEG2RAD = PI / 180;

    RAD2DEG = 180 / PI;

    chroma = function() {
      if (arguments[0] instanceof Color) {
        return arguments[0];
      }
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, arguments, function(){});
    };

    chroma["default"] = chroma;

    _interpolators = [];

    if (('object' !== "undefined" && module !== null) && (module.exports != null)) {
      module.exports = chroma;
    }

    if (typeof undefined === 'function' && undefined.amd) {
      undefined([], function() {
        return chroma;
      });
    } else {
      root = 'object' !== "undefined" && exports !== null ? exports : this;
      root.chroma = chroma;
    }

    chroma.version = '1.3.5';

    _input = {};

    _guess_formats = [];

    _guess_formats_sorted = false;

    Color = (function() {
      function Color() {
        var arg, args, chk, len, len1, me, mode, o, w;
        me = this;
        args = [];
        for (o = 0, len = arguments.length; o < len; o++) {
          arg = arguments[o];
          if (arg != null) {
            args.push(arg);
          }
        }
        if (args.length > 1) {
          mode = args[args.length - 1];
        }
        if (_input[mode] != null) {
          me._rgb = clip_rgb(_input[mode](unpack(args.slice(0, -1))));
        } else {
          if (!_guess_formats_sorted) {
            _guess_formats = _guess_formats.sort(function(a, b) {
              return b.p - a.p;
            });
            _guess_formats_sorted = true;
          }
          for (w = 0, len1 = _guess_formats.length; w < len1; w++) {
            chk = _guess_formats[w];
            mode = chk.test.apply(chk, args);
            if (mode) {
              break;
            }
          }
          if (mode) {
            me._rgb = clip_rgb(_input[mode].apply(_input, args));
          }
        }
        if (me._rgb == null) {
          console.warn('unknown format: ' + args);
        }
        if (me._rgb == null) {
          me._rgb = [0, 0, 0];
        }
        if (me._rgb.length === 3) {
          me._rgb.push(1);
        }
      }

      Color.prototype.toString = function() {
        return this.hex();
      };

      Color.prototype.clone = function() {
        return chroma(me._rgb);
      };

      return Color;

    })();

    chroma._input = _input;


    /**
    	ColorBrewer colors for chroma.js
    
    	Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and The 
    	Pennsylvania State University.
    
    	Licensed under the Apache License, Version 2.0 (the "License"); 
    	you may not use this file except in compliance with the License.
    	You may obtain a copy of the License at	
    	http://www.apache.org/licenses/LICENSE-2.0
    
    	Unless required by applicable law or agreed to in writing, software distributed
    	under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
    	CONDITIONS OF ANY KIND, either express or implied. See the License for the
    	specific language governing permissions and limitations under the License.
    
        @preserve
     */

    chroma.brewer = brewer = {
      OrRd: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
      PuBu: ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'],
      BuPu: ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'],
      Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
      BuGn: ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'],
      YlOrBr: ['#ffffe5', '#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506'],
      YlGn: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
      Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
      RdPu: ['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177', '#49006a'],
      Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
      YlGnBu: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
      Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
      GnBu: ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
      Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
      YlOrRd: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
      PuRd: ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#980043', '#67001f'],
      Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
      PuBuGn: ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
      Viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
      Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
      RdYlGn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
      RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
      PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
      PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
      RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
      BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
      RdGy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
      PuOr: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
      Set2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
      Accent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
      Set1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
      Set3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
      Dark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
      Paired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
      Pastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
      Pastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2']
    };

    (function() {
      var key, results;
      results = [];
      for (key in brewer) {
        results.push(brewer[key.toLowerCase()] = brewer[key]);
      }
      return results;
    })();


    /**
    	X11 color names
    
    	http://www.w3.org/TR/css3-color/#svg-color
     */

    w3cx11 = {
      aliceblue: '#f0f8ff',
      antiquewhite: '#faebd7',
      aqua: '#00ffff',
      aquamarine: '#7fffd4',
      azure: '#f0ffff',
      beige: '#f5f5dc',
      bisque: '#ffe4c4',
      black: '#000000',
      blanchedalmond: '#ffebcd',
      blue: '#0000ff',
      blueviolet: '#8a2be2',
      brown: '#a52a2a',
      burlywood: '#deb887',
      cadetblue: '#5f9ea0',
      chartreuse: '#7fff00',
      chocolate: '#d2691e',
      coral: '#ff7f50',
      cornflower: '#6495ed',
      cornflowerblue: '#6495ed',
      cornsilk: '#fff8dc',
      crimson: '#dc143c',
      cyan: '#00ffff',
      darkblue: '#00008b',
      darkcyan: '#008b8b',
      darkgoldenrod: '#b8860b',
      darkgray: '#a9a9a9',
      darkgreen: '#006400',
      darkgrey: '#a9a9a9',
      darkkhaki: '#bdb76b',
      darkmagenta: '#8b008b',
      darkolivegreen: '#556b2f',
      darkorange: '#ff8c00',
      darkorchid: '#9932cc',
      darkred: '#8b0000',
      darksalmon: '#e9967a',
      darkseagreen: '#8fbc8f',
      darkslateblue: '#483d8b',
      darkslategray: '#2f4f4f',
      darkslategrey: '#2f4f4f',
      darkturquoise: '#00ced1',
      darkviolet: '#9400d3',
      deeppink: '#ff1493',
      deepskyblue: '#00bfff',
      dimgray: '#696969',
      dimgrey: '#696969',
      dodgerblue: '#1e90ff',
      firebrick: '#b22222',
      floralwhite: '#fffaf0',
      forestgreen: '#228b22',
      fuchsia: '#ff00ff',
      gainsboro: '#dcdcdc',
      ghostwhite: '#f8f8ff',
      gold: '#ffd700',
      goldenrod: '#daa520',
      gray: '#808080',
      green: '#008000',
      greenyellow: '#adff2f',
      grey: '#808080',
      honeydew: '#f0fff0',
      hotpink: '#ff69b4',
      indianred: '#cd5c5c',
      indigo: '#4b0082',
      ivory: '#fffff0',
      khaki: '#f0e68c',
      laserlemon: '#ffff54',
      lavender: '#e6e6fa',
      lavenderblush: '#fff0f5',
      lawngreen: '#7cfc00',
      lemonchiffon: '#fffacd',
      lightblue: '#add8e6',
      lightcoral: '#f08080',
      lightcyan: '#e0ffff',
      lightgoldenrod: '#fafad2',
      lightgoldenrodyellow: '#fafad2',
      lightgray: '#d3d3d3',
      lightgreen: '#90ee90',
      lightgrey: '#d3d3d3',
      lightpink: '#ffb6c1',
      lightsalmon: '#ffa07a',
      lightseagreen: '#20b2aa',
      lightskyblue: '#87cefa',
      lightslategray: '#778899',
      lightslategrey: '#778899',
      lightsteelblue: '#b0c4de',
      lightyellow: '#ffffe0',
      lime: '#00ff00',
      limegreen: '#32cd32',
      linen: '#faf0e6',
      magenta: '#ff00ff',
      maroon: '#800000',
      maroon2: '#7f0000',
      maroon3: '#b03060',
      mediumaquamarine: '#66cdaa',
      mediumblue: '#0000cd',
      mediumorchid: '#ba55d3',
      mediumpurple: '#9370db',
      mediumseagreen: '#3cb371',
      mediumslateblue: '#7b68ee',
      mediumspringgreen: '#00fa9a',
      mediumturquoise: '#48d1cc',
      mediumvioletred: '#c71585',
      midnightblue: '#191970',
      mintcream: '#f5fffa',
      mistyrose: '#ffe4e1',
      moccasin: '#ffe4b5',
      navajowhite: '#ffdead',
      navy: '#000080',
      oldlace: '#fdf5e6',
      olive: '#808000',
      olivedrab: '#6b8e23',
      orange: '#ffa500',
      orangered: '#ff4500',
      orchid: '#da70d6',
      palegoldenrod: '#eee8aa',
      palegreen: '#98fb98',
      paleturquoise: '#afeeee',
      palevioletred: '#db7093',
      papayawhip: '#ffefd5',
      peachpuff: '#ffdab9',
      peru: '#cd853f',
      pink: '#ffc0cb',
      plum: '#dda0dd',
      powderblue: '#b0e0e6',
      purple: '#800080',
      purple2: '#7f007f',
      purple3: '#a020f0',
      rebeccapurple: '#663399',
      red: '#ff0000',
      rosybrown: '#bc8f8f',
      royalblue: '#4169e1',
      saddlebrown: '#8b4513',
      salmon: '#fa8072',
      sandybrown: '#f4a460',
      seagreen: '#2e8b57',
      seashell: '#fff5ee',
      sienna: '#a0522d',
      silver: '#c0c0c0',
      skyblue: '#87ceeb',
      slateblue: '#6a5acd',
      slategray: '#708090',
      slategrey: '#708090',
      snow: '#fffafa',
      springgreen: '#00ff7f',
      steelblue: '#4682b4',
      tan: '#d2b48c',
      teal: '#008080',
      thistle: '#d8bfd8',
      tomato: '#ff6347',
      turquoise: '#40e0d0',
      violet: '#ee82ee',
      wheat: '#f5deb3',
      white: '#ffffff',
      whitesmoke: '#f5f5f5',
      yellow: '#ffff00',
      yellowgreen: '#9acd32'
    };

    chroma.colors = colors = w3cx11;

    lab2rgb = function() {
      var a, args, b, g, l, r, x, y, z;
      args = unpack(arguments);
      l = args[0], a = args[1], b = args[2];
      y = (l + 16) / 116;
      x = isNaN(a) ? y : y + a / 500;
      z = isNaN(b) ? y : y - b / 200;
      y = LAB_CONSTANTS.Yn * lab_xyz(y);
      x = LAB_CONSTANTS.Xn * lab_xyz(x);
      z = LAB_CONSTANTS.Zn * lab_xyz(z);
      r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);
      g = xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z);
      b = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);
      return [r, g, b, args.length > 3 ? args[3] : 1];
    };

    xyz_rgb = function(r) {
      return 255 * (r <= 0.00304 ? 12.92 * r : 1.055 * pow(r, 1 / 2.4) - 0.055);
    };

    lab_xyz = function(t) {
      if (t > LAB_CONSTANTS.t1) {
        return t * t * t;
      } else {
        return LAB_CONSTANTS.t2 * (t - LAB_CONSTANTS.t0);
      }
    };

    LAB_CONSTANTS = {
      Kn: 18,
      Xn: 0.950470,
      Yn: 1,
      Zn: 1.088830,
      t0: 0.137931034,
      t1: 0.206896552,
      t2: 0.12841855,
      t3: 0.008856452
    };

    rgb2lab = function() {
      var b, g, r, ref, ref1, x, y, z;
      ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
      ref1 = rgb2xyz(r, g, b), x = ref1[0], y = ref1[1], z = ref1[2];
      return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    };

    rgb_xyz = function(r) {
      if ((r /= 255) <= 0.04045) {
        return r / 12.92;
      } else {
        return pow((r + 0.055) / 1.055, 2.4);
      }
    };

    xyz_lab = function(t) {
      if (t > LAB_CONSTANTS.t3) {
        return pow(t, 1 / 3);
      } else {
        return t / LAB_CONSTANTS.t2 + LAB_CONSTANTS.t0;
      }
    };

    rgb2xyz = function() {
      var b, g, r, ref, x, y, z;
      ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
      r = rgb_xyz(r);
      g = rgb_xyz(g);
      b = rgb_xyz(b);
      x = xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / LAB_CONSTANTS.Xn);
      y = xyz_lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / LAB_CONSTANTS.Yn);
      z = xyz_lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / LAB_CONSTANTS.Zn);
      return [x, y, z];
    };

    chroma.lab = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['lab']), function(){});
    };

    _input.lab = lab2rgb;

    Color.prototype.lab = function() {
      return rgb2lab(this._rgb);
    };

    bezier = function(colors) {
      var I, I0, I1, c, lab0, lab1, lab2, lab3, ref, ref1, ref2;
      colors = (function() {
        var len, o, results;
        results = [];
        for (o = 0, len = colors.length; o < len; o++) {
          c = colors[o];
          results.push(chroma(c));
        }
        return results;
      })();
      if (colors.length === 2) {
        ref = (function() {
          var len, o, results;
          results = [];
          for (o = 0, len = colors.length; o < len; o++) {
            c = colors[o];
            results.push(c.lab());
          }
          return results;
        })(), lab0 = ref[0], lab1 = ref[1];
        I = function(t) {
          var i, lab;
          lab = (function() {
            var o, results;
            results = [];
            for (i = o = 0; o <= 2; i = ++o) {
              results.push(lab0[i] + t * (lab1[i] - lab0[i]));
            }
            return results;
          })();
          return chroma.lab.apply(chroma, lab);
        };
      } else if (colors.length === 3) {
        ref1 = (function() {
          var len, o, results;
          results = [];
          for (o = 0, len = colors.length; o < len; o++) {
            c = colors[o];
            results.push(c.lab());
          }
          return results;
        })(), lab0 = ref1[0], lab1 = ref1[1], lab2 = ref1[2];
        I = function(t) {
          var i, lab;
          lab = (function() {
            var o, results;
            results = [];
            for (i = o = 0; o <= 2; i = ++o) {
              results.push((1 - t) * (1 - t) * lab0[i] + 2 * (1 - t) * t * lab1[i] + t * t * lab2[i]);
            }
            return results;
          })();
          return chroma.lab.apply(chroma, lab);
        };
      } else if (colors.length === 4) {
        ref2 = (function() {
          var len, o, results;
          results = [];
          for (o = 0, len = colors.length; o < len; o++) {
            c = colors[o];
            results.push(c.lab());
          }
          return results;
        })(), lab0 = ref2[0], lab1 = ref2[1], lab2 = ref2[2], lab3 = ref2[3];
        I = function(t) {
          var i, lab;
          lab = (function() {
            var o, results;
            results = [];
            for (i = o = 0; o <= 2; i = ++o) {
              results.push((1 - t) * (1 - t) * (1 - t) * lab0[i] + 3 * (1 - t) * (1 - t) * t * lab1[i] + 3 * (1 - t) * t * t * lab2[i] + t * t * t * lab3[i]);
            }
            return results;
          })();
          return chroma.lab.apply(chroma, lab);
        };
      } else if (colors.length === 5) {
        I0 = bezier(colors.slice(0, 3));
        I1 = bezier(colors.slice(2, 5));
        I = function(t) {
          if (t < 0.5) {
            return I0(t * 2);
          } else {
            return I1((t - 0.5) * 2);
          }
        };
      }
      return I;
    };

    chroma.bezier = function(colors) {
      var f;
      f = bezier(colors);
      f.scale = function() {
        return chroma.scale(f);
      };
      return f;
    };


    /*
        chroma.js
    
        Copyright (c) 2011-2013, Gregor Aisch
        All rights reserved.
    
        Redistribution and use in source and binary forms, with or without
        modification, are permitted provided that the following conditions are met:
    
        * Redistributions of source code must retain the above copyright notice, this
          list of conditions and the following disclaimer.
    
        * Redistributions in binary form must reproduce the above copyright notice,
          this list of conditions and the following disclaimer in the documentation
          and/or other materials provided with the distribution.
    
        * The name Gregor Aisch may not be used to endorse or promote products
          derived from this software without specific prior written permission.
    
        THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
        AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
        IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
        DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
        INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
        BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
        DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
        OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
        NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
        EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    
        @source: https://github.com/gka/chroma.js
     */

    chroma.cubehelix = function(start, rotations, hue, gamma, lightness) {
      var dh, dl, f;
      if (start == null) {
        start = 300;
      }
      if (rotations == null) {
        rotations = -1.5;
      }
      if (hue == null) {
        hue = 1;
      }
      if (gamma == null) {
        gamma = 1;
      }
      if (lightness == null) {
        lightness = [0, 1];
      }
      dh = 0;
      if (type(lightness) === 'array') {
        dl = lightness[1] - lightness[0];
      } else {
        dl = 0;
        lightness = [lightness, lightness];
      }
      f = function(fract) {
        var a, amp, b, cos_a, g, h, l, r, sin_a;
        a = TWOPI * ((start + 120) / 360 + rotations * fract);
        l = pow(lightness[0] + dl * fract, gamma);
        h = dh !== 0 ? hue[0] + fract * dh : hue;
        amp = h * l * (1 - l) / 2;
        cos_a = cos(a);
        sin_a = sin(a);
        r = l + amp * (-0.14861 * cos_a + 1.78277 * sin_a);
        g = l + amp * (-0.29227 * cos_a - 0.90649 * sin_a);
        b = l + amp * (+1.97294 * cos_a);
        return chroma(clip_rgb([r * 255, g * 255, b * 255]));
      };
      f.start = function(s) {
        if (s == null) {
          return start;
        }
        start = s;
        return f;
      };
      f.rotations = function(r) {
        if (r == null) {
          return rotations;
        }
        rotations = r;
        return f;
      };
      f.gamma = function(g) {
        if (g == null) {
          return gamma;
        }
        gamma = g;
        return f;
      };
      f.hue = function(h) {
        if (h == null) {
          return hue;
        }
        hue = h;
        if (type(hue) === 'array') {
          dh = hue[1] - hue[0];
          if (dh === 0) {
            hue = hue[1];
          }
        } else {
          dh = 0;
        }
        return f;
      };
      f.lightness = function(h) {
        if (h == null) {
          return lightness;
        }
        if (type(h) === 'array') {
          lightness = h;
          dl = h[1] - h[0];
        } else {
          lightness = [h, h];
          dl = 0;
        }
        return f;
      };
      f.scale = function() {
        return chroma.scale(f);
      };
      f.hue(hue);
      return f;
    };

    chroma.random = function() {
      var code, digits, i, o;
      digits = '0123456789abcdef';
      code = '#';
      for (i = o = 0; o < 6; i = ++o) {
        code += digits.charAt(floor(Math.random() * 16));
      }
      return new Color(code);
    };

    _interpolators = [];

    interpolate = function(col1, col2, f, m) {
      var interpol, len, o, res;
      if (f == null) {
        f = 0.5;
      }
      if (m == null) {
        m = 'rgb';
      }

      /*
      interpolates between colors
      f = 0 --> me
      f = 1 --> col
       */
      if (type(col1) !== 'object') {
        col1 = chroma(col1);
      }
      if (type(col2) !== 'object') {
        col2 = chroma(col2);
      }
      for (o = 0, len = _interpolators.length; o < len; o++) {
        interpol = _interpolators[o];
        if (m === interpol[0]) {
          res = interpol[1](col1, col2, f, m);
          break;
        }
      }
      if (res == null) {
        throw "color mode " + m + " is not supported";
      }
      return res.alpha(col1.alpha() + f * (col2.alpha() - col1.alpha()));
    };

    chroma.interpolate = interpolate;

    Color.prototype.interpolate = function(col2, f, m) {
      return interpolate(this, col2, f, m);
    };

    chroma.mix = interpolate;

    Color.prototype.mix = Color.prototype.interpolate;

    _input.rgb = function() {
      var k, ref, results, v;
      ref = unpack(arguments);
      results = [];
      for (k in ref) {
        v = ref[k];
        results.push(v);
      }
      return results;
    };

    chroma.rgb = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['rgb']), function(){});
    };

    Color.prototype.rgb = function(round) {
      if (round == null) {
        round = true;
      }
      if (round) {
        return this._rgb.map(Math.round).slice(0, 3);
      } else {
        return this._rgb.slice(0, 3);
      }
    };

    Color.prototype.rgba = function(round) {
      if (round == null) {
        round = true;
      }
      if (!round) {
        return this._rgb.slice(0);
      }
      return [Math.round(this._rgb[0]), Math.round(this._rgb[1]), Math.round(this._rgb[2]), this._rgb[3]];
    };

    _guess_formats.push({
      p: 3,
      test: function(n) {
        var a;
        a = unpack(arguments);
        if (type(a) === 'array' && a.length === 3) {
          return 'rgb';
        }
        if (a.length === 4 && type(a[3]) === "number" && a[3] >= 0 && a[3] <= 1) {
          return 'rgb';
        }
      }
    });

    _input.lrgb = _input.rgb;

    interpolate_lrgb = function(col1, col2, f, m) {
      var xyz0, xyz1;
      xyz0 = col1._rgb;
      xyz1 = col2._rgb;
      return new Color(sqrt(pow(xyz0[0], 2) * (1 - f) + pow(xyz1[0], 2) * f), sqrt(pow(xyz0[1], 2) * (1 - f) + pow(xyz1[1], 2) * f), sqrt(pow(xyz0[2], 2) * (1 - f) + pow(xyz1[2], 2) * f), m);
    };

    _average_lrgb = function(colors) {
      var col, f, len, o, rgb, xyz;
      f = 1 / colors.length;
      xyz = [0, 0, 0, 0];
      for (o = 0, len = colors.length; o < len; o++) {
        col = colors[o];
        rgb = col._rgb;
        xyz[0] += pow(rgb[0], 2) * f;
        xyz[1] += pow(rgb[1], 2) * f;
        xyz[2] += pow(rgb[2], 2) * f;
        xyz[3] += rgb[3] * f;
      }
      xyz[0] = sqrt(xyz[0]);
      xyz[1] = sqrt(xyz[1]);
      xyz[2] = sqrt(xyz[2]);
      return new Color(xyz);
    };

    _interpolators.push(['lrgb', interpolate_lrgb]);

    chroma.average = function(colors, mode) {
      var A, alpha, c, cnt, dx, dy, first, i, l, len, o, xyz, xyz2;
      if (mode == null) {
        mode = 'rgb';
      }
      l = colors.length;
      colors = colors.map(function(c) {
        return chroma(c);
      });
      first = colors.splice(0, 1)[0];
      if (mode === 'lrgb') {
        return _average_lrgb(colors);
      }
      xyz = first.get(mode);
      cnt = [];
      dx = 0;
      dy = 0;
      for (i in xyz) {
        xyz[i] = xyz[i] || 0;
        cnt.push(!isNaN(xyz[i]) ? 1 : 0);
        if (mode.charAt(i) === 'h' && !isNaN(xyz[i])) {
          A = xyz[i] / 180 * PI;
          dx += cos(A);
          dy += sin(A);
        }
      }
      alpha = first.alpha();
      for (o = 0, len = colors.length; o < len; o++) {
        c = colors[o];
        xyz2 = c.get(mode);
        alpha += c.alpha();
        for (i in xyz) {
          if (!isNaN(xyz2[i])) {
            xyz[i] += xyz2[i];
            cnt[i] += 1;
            if (mode.charAt(i) === 'h') {
              A = xyz[i] / 180 * PI;
              dx += cos(A);
              dy += sin(A);
            }
          }
        }
      }
      for (i in xyz) {
        xyz[i] = xyz[i] / cnt[i];
        if (mode.charAt(i) === 'h') {
          A = atan2(dy / cnt[i], dx / cnt[i]) / PI * 180;
          while (A < 0) {
            A += 360;
          }
          while (A >= 360) {
            A -= 360;
          }
          xyz[i] = A;
        }
      }
      return chroma(xyz, mode).alpha(alpha / l);
    };

    hex2rgb = function(hex) {
      var a, b, g, r, rgb, u;
      if (hex.match(/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
        if (hex.length === 4 || hex.length === 7) {
          hex = hex.substr(1);
        }
        if (hex.length === 3) {
          hex = hex.split("");
          hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        u = parseInt(hex, 16);
        r = u >> 16;
        g = u >> 8 & 0xFF;
        b = u & 0xFF;
        return [r, g, b, 1];
      }
      if (hex.match(/^#?([A-Fa-f0-9]{8})$/)) {
        if (hex.length === 9) {
          hex = hex.substr(1);
        }
        u = parseInt(hex, 16);
        r = u >> 24 & 0xFF;
        g = u >> 16 & 0xFF;
        b = u >> 8 & 0xFF;
        a = round((u & 0xFF) / 0xFF * 100) / 100;
        return [r, g, b, a];
      }
      if ((_input.css != null) && (rgb = _input.css(hex))) {
        return rgb;
      }
      throw "unknown color: " + hex;
    };

    rgb2hex = function(channels, mode) {
      var a, b, g, hxa, r, str, u;
      if (mode == null) {
        mode = 'rgb';
      }
      r = channels[0], g = channels[1], b = channels[2], a = channels[3];
      r = Math.round(r);
      g = Math.round(g);
      b = Math.round(b);
      u = r << 16 | g << 8 | b;
      str = "000000" + u.toString(16);
      str = str.substr(str.length - 6);
      hxa = '0' + round(a * 255).toString(16);
      hxa = hxa.substr(hxa.length - 2);
      return "#" + (function() {
        switch (mode.toLowerCase()) {
          case 'rgba':
            return str + hxa;
          case 'argb':
            return hxa + str;
          default:
            return str;
        }
      })();
    };

    _input.hex = function(h) {
      return hex2rgb(h);
    };

    chroma.hex = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['hex']), function(){});
    };

    Color.prototype.hex = function(mode) {
      if (mode == null) {
        mode = 'rgb';
      }
      return rgb2hex(this._rgb, mode);
    };

    _guess_formats.push({
      p: 4,
      test: function(n) {
        if (arguments.length === 1 && type(n) === "string") {
          return 'hex';
        }
      }
    });

    hsl2rgb = function() {
      var args, b, c, g, h, i, l, o, r, ref, s, t1, t2, t3;
      args = unpack(arguments);
      h = args[0], s = args[1], l = args[2];
      if (s === 0) {
        r = g = b = l * 255;
      } else {
        t3 = [0, 0, 0];
        c = [0, 0, 0];
        t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
        t1 = 2 * l - t2;
        h /= 360;
        t3[0] = h + 1 / 3;
        t3[1] = h;
        t3[2] = h - 1 / 3;
        for (i = o = 0; o <= 2; i = ++o) {
          if (t3[i] < 0) {
            t3[i] += 1;
          }
          if (t3[i] > 1) {
            t3[i] -= 1;
          }
          if (6 * t3[i] < 1) {
            c[i] = t1 + (t2 - t1) * 6 * t3[i];
          } else if (2 * t3[i] < 1) {
            c[i] = t2;
          } else if (3 * t3[i] < 2) {
            c[i] = t1 + (t2 - t1) * ((2 / 3) - t3[i]) * 6;
          } else {
            c[i] = t1;
          }
        }
        ref = [round(c[0] * 255), round(c[1] * 255), round(c[2] * 255)], r = ref[0], g = ref[1], b = ref[2];
      }
      if (args.length > 3) {
        return [r, g, b, args[3]];
      } else {
        return [r, g, b];
      }
    };

    rgb2hsl = function(r, g, b) {
      var h, l, min, ref, s;
      if (r !== void 0 && r.length >= 3) {
        ref = r, r = ref[0], g = ref[1], b = ref[2];
      }
      r /= 255;
      g /= 255;
      b /= 255;
      min = Math.min(r, g, b);
      max = Math.max(r, g, b);
      l = (max + min) / 2;
      if (max === min) {
        s = 0;
        h = Number.NaN;
      } else {
        s = l < 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);
      }
      if (r === max) {
        h = (g - b) / (max - min);
      } else if (g === max) {
        h = 2 + (b - r) / (max - min);
      } else if (b === max) {
        h = 4 + (r - g) / (max - min);
      }
      h *= 60;
      if (h < 0) {
        h += 360;
      }
      return [h, s, l];
    };

    chroma.hsl = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['hsl']), function(){});
    };

    _input.hsl = hsl2rgb;

    Color.prototype.hsl = function() {
      return rgb2hsl(this._rgb);
    };

    hsv2rgb = function() {
      var args, b, f, g, h, i, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, s, t, v;
      args = unpack(arguments);
      h = args[0], s = args[1], v = args[2];
      v *= 255;
      if (s === 0) {
        r = g = b = v;
      } else {
        if (h === 360) {
          h = 0;
        }
        if (h > 360) {
          h -= 360;
        }
        if (h < 0) {
          h += 360;
        }
        h /= 60;
        i = floor(h);
        f = h - i;
        p = v * (1 - s);
        q = v * (1 - s * f);
        t = v * (1 - s * (1 - f));
        switch (i) {
          case 0:
            ref = [v, t, p], r = ref[0], g = ref[1], b = ref[2];
            break;
          case 1:
            ref1 = [q, v, p], r = ref1[0], g = ref1[1], b = ref1[2];
            break;
          case 2:
            ref2 = [p, v, t], r = ref2[0], g = ref2[1], b = ref2[2];
            break;
          case 3:
            ref3 = [p, q, v], r = ref3[0], g = ref3[1], b = ref3[2];
            break;
          case 4:
            ref4 = [t, p, v], r = ref4[0], g = ref4[1], b = ref4[2];
            break;
          case 5:
            ref5 = [v, p, q], r = ref5[0], g = ref5[1], b = ref5[2];
        }
      }
      return [r, g, b, args.length > 3 ? args[3] : 1];
    };

    rgb2hsv = function() {
      var b, delta, g, h, min, r, ref, s, v;
      ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
      min = Math.min(r, g, b);
      max = Math.max(r, g, b);
      delta = max - min;
      v = max / 255.0;
      if (max === 0) {
        h = Number.NaN;
        s = 0;
      } else {
        s = delta / max;
        if (r === max) {
          h = (g - b) / delta;
        }
        if (g === max) {
          h = 2 + (b - r) / delta;
        }
        if (b === max) {
          h = 4 + (r - g) / delta;
        }
        h *= 60;
        if (h < 0) {
          h += 360;
        }
      }
      return [h, s, v];
    };

    chroma.hsv = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['hsv']), function(){});
    };

    _input.hsv = hsv2rgb;

    Color.prototype.hsv = function() {
      return rgb2hsv(this._rgb);
    };

    num2rgb = function(num) {
      var b, g, r;
      if (type(num) === "number" && num >= 0 && num <= 0xFFFFFF) {
        r = num >> 16;
        g = (num >> 8) & 0xFF;
        b = num & 0xFF;
        return [r, g, b, 1];
      }
      console.warn("unknown num color: " + num);
      return [0, 0, 0, 1];
    };

    rgb2num = function() {
      var b, g, r, ref;
      ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
      return (r << 16) + (g << 8) + b;
    };

    chroma.num = function(num) {
      return new Color(num, 'num');
    };

    Color.prototype.num = function(mode) {
      if (mode == null) {
        mode = 'rgb';
      }
      return rgb2num(this._rgb, mode);
    };

    _input.num = num2rgb;

    _guess_formats.push({
      p: 1,
      test: function(n) {
        if (arguments.length === 1 && type(n) === "number" && n >= 0 && n <= 0xFFFFFF) {
          return 'num';
        }
      }
    });

    hcg2rgb = function() {
      var _c, _g, args, b, c, f, g, h, i, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, t, v;
      args = unpack(arguments);
      h = args[0], c = args[1], _g = args[2];
      c = c / 100;
      g = g / 100 * 255;
      _c = c * 255;
      if (c === 0) {
        r = g = b = _g;
      } else {
        if (h === 360) {
          h = 0;
        }
        if (h > 360) {
          h -= 360;
        }
        if (h < 0) {
          h += 360;
        }
        h /= 60;
        i = floor(h);
        f = h - i;
        p = _g * (1 - c);
        q = p + _c * (1 - f);
        t = p + _c * f;
        v = p + _c;
        switch (i) {
          case 0:
            ref = [v, t, p], r = ref[0], g = ref[1], b = ref[2];
            break;
          case 1:
            ref1 = [q, v, p], r = ref1[0], g = ref1[1], b = ref1[2];
            break;
          case 2:
            ref2 = [p, v, t], r = ref2[0], g = ref2[1], b = ref2[2];
            break;
          case 3:
            ref3 = [p, q, v], r = ref3[0], g = ref3[1], b = ref3[2];
            break;
          case 4:
            ref4 = [t, p, v], r = ref4[0], g = ref4[1], b = ref4[2];
            break;
          case 5:
            ref5 = [v, p, q], r = ref5[0], g = ref5[1], b = ref5[2];
        }
      }
      return [r, g, b, args.length > 3 ? args[3] : 1];
    };

    rgb2hcg = function() {
      var _g, b, c, delta, g, h, min, r, ref;
      ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
      min = Math.min(r, g, b);
      max = Math.max(r, g, b);
      delta = max - min;
      c = delta * 100 / 255;
      _g = min / (255 - delta) * 100;
      if (delta === 0) {
        h = Number.NaN;
      } else {
        if (r === max) {
          h = (g - b) / delta;
        }
        if (g === max) {
          h = 2 + (b - r) / delta;
        }
        if (b === max) {
          h = 4 + (r - g) / delta;
        }
        h *= 60;
        if (h < 0) {
          h += 360;
        }
      }
      return [h, c, _g];
    };

    chroma.hcg = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['hcg']), function(){});
    };

    _input.hcg = hcg2rgb;

    Color.prototype.hcg = function() {
      return rgb2hcg(this._rgb);
    };

    css2rgb = function(css) {
      var aa, ab, hsl, i, m, o, rgb, w;
      css = css.toLowerCase();
      if ((chroma.colors != null) && chroma.colors[css]) {
        return hex2rgb(chroma.colors[css]);
      }
      if (m = css.match(/rgb\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*\)/)) {
        rgb = m.slice(1, 4);
        for (i = o = 0; o <= 2; i = ++o) {
          rgb[i] = +rgb[i];
        }
        rgb[3] = 1;
      } else if (m = css.match(/rgba\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*,\s*([01]|[01]?\.\d+)\)/)) {
        rgb = m.slice(1, 5);
        for (i = w = 0; w <= 3; i = ++w) {
          rgb[i] = +rgb[i];
        }
      } else if (m = css.match(/rgb\(\s*(\-?\d+(?:\.\d+)?)%,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*\)/)) {
        rgb = m.slice(1, 4);
        for (i = aa = 0; aa <= 2; i = ++aa) {
          rgb[i] = round(rgb[i] * 2.55);
        }
        rgb[3] = 1;
      } else if (m = css.match(/rgba\(\s*(\-?\d+(?:\.\d+)?)%,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)/)) {
        rgb = m.slice(1, 5);
        for (i = ab = 0; ab <= 2; i = ++ab) {
          rgb[i] = round(rgb[i] * 2.55);
        }
        rgb[3] = +rgb[3];
      } else if (m = css.match(/hsl\(\s*(\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*\)/)) {
        hsl = m.slice(1, 4);
        hsl[1] *= 0.01;
        hsl[2] *= 0.01;
        rgb = hsl2rgb(hsl);
        rgb[3] = 1;
      } else if (m = css.match(/hsla\(\s*(\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)/)) {
        hsl = m.slice(1, 4);
        hsl[1] *= 0.01;
        hsl[2] *= 0.01;
        rgb = hsl2rgb(hsl);
        rgb[3] = +m[4];
      }
      return rgb;
    };

    rgb2css = function(rgba) {
      var mode;
      mode = rgba[3] < 1 ? 'rgba' : 'rgb';
      if (mode === 'rgb') {
        return mode + '(' + rgba.slice(0, 3).map(round).join(',') + ')';
      } else if (mode === 'rgba') {
        return mode + '(' + rgba.slice(0, 3).map(round).join(',') + ',' + rgba[3] + ')';
      } else {

      }
    };

    rnd = function(a) {
      return round(a * 100) / 100;
    };

    hsl2css = function(hsl, alpha) {
      var mode;
      mode = alpha < 1 ? 'hsla' : 'hsl';
      hsl[0] = rnd(hsl[0] || 0);
      hsl[1] = rnd(hsl[1] * 100) + '%';
      hsl[2] = rnd(hsl[2] * 100) + '%';
      if (mode === 'hsla') {
        hsl[3] = alpha;
      }
      return mode + '(' + hsl.join(',') + ')';
    };

    _input.css = function(h) {
      return css2rgb(h);
    };

    chroma.css = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['css']), function(){});
    };

    Color.prototype.css = function(mode) {
      if (mode == null) {
        mode = 'rgb';
      }
      if (mode.slice(0, 3) === 'rgb') {
        return rgb2css(this._rgb);
      } else if (mode.slice(0, 3) === 'hsl') {
        return hsl2css(this.hsl(), this.alpha());
      }
    };

    _input.named = function(name) {
      return hex2rgb(w3cx11[name]);
    };

    _guess_formats.push({
      p: 5,
      test: function(n) {
        if (arguments.length === 1 && (w3cx11[n] != null)) {
          return 'named';
        }
      }
    });

    Color.prototype.name = function(n) {
      var h, k;
      if (arguments.length) {
        if (w3cx11[n]) {
          this._rgb = hex2rgb(w3cx11[n]);
        }
        this._rgb[3] = 1;
      }
      h = this.hex();
      for (k in w3cx11) {
        if (h === w3cx11[k]) {
          return k;
        }
      }
      return h;
    };

    lch2lab = function() {

      /*
      Convert from a qualitative parameter h and a quantitative parameter l to a 24-bit pixel.
      These formulas were invented by David Dalrymple to obtain maximum contrast without going
      out of gamut if the parameters are in the range 0-1.
      
      A saturation multiplier was added by Gregor Aisch
       */
      var c, h, l, ref;
      ref = unpack(arguments), l = ref[0], c = ref[1], h = ref[2];
      h = h * DEG2RAD;
      return [l, cos(h) * c, sin(h) * c];
    };

    lch2rgb = function() {
      var L, a, args, b, c, g, h, l, r, ref, ref1;
      args = unpack(arguments);
      l = args[0], c = args[1], h = args[2];
      ref = lch2lab(l, c, h), L = ref[0], a = ref[1], b = ref[2];
      ref1 = lab2rgb(L, a, b), r = ref1[0], g = ref1[1], b = ref1[2];
      return [r, g, b, args.length > 3 ? args[3] : 1];
    };

    lab2lch = function() {
      var a, b, c, h, l, ref;
      ref = unpack(arguments), l = ref[0], a = ref[1], b = ref[2];
      c = sqrt(a * a + b * b);
      h = (atan2(b, a) * RAD2DEG + 360) % 360;
      if (round(c * 10000) === 0) {
        h = Number.NaN;
      }
      return [l, c, h];
    };

    rgb2lch = function() {
      var a, b, g, l, r, ref, ref1;
      ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
      ref1 = rgb2lab(r, g, b), l = ref1[0], a = ref1[1], b = ref1[2];
      return lab2lch(l, a, b);
    };

    chroma.lch = function() {
      var args;
      args = unpack(arguments);
      return new Color(args, 'lch');
    };

    chroma.hcl = function() {
      var args;
      args = unpack(arguments);
      return new Color(args, 'hcl');
    };

    _input.lch = lch2rgb;

    _input.hcl = function() {
      var c, h, l, ref;
      ref = unpack(arguments), h = ref[0], c = ref[1], l = ref[2];
      return lch2rgb([l, c, h]);
    };

    Color.prototype.lch = function() {
      return rgb2lch(this._rgb);
    };

    Color.prototype.hcl = function() {
      return rgb2lch(this._rgb).reverse();
    };

    rgb2cmyk = function(mode) {
      var b, c, f, g, k, m, r, ref, y;
      if (mode == null) {
        mode = 'rgb';
      }
      ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
      r = r / 255;
      g = g / 255;
      b = b / 255;
      k = 1 - Math.max(r, Math.max(g, b));
      f = k < 1 ? 1 / (1 - k) : 0;
      c = (1 - r - k) * f;
      m = (1 - g - k) * f;
      y = (1 - b - k) * f;
      return [c, m, y, k];
    };

    cmyk2rgb = function() {
      var alpha, args, b, c, g, k, m, r, y;
      args = unpack(arguments);
      c = args[0], m = args[1], y = args[2], k = args[3];
      alpha = args.length > 4 ? args[4] : 1;
      if (k === 1) {
        return [0, 0, 0, alpha];
      }
      r = c >= 1 ? 0 : 255 * (1 - c) * (1 - k);
      g = m >= 1 ? 0 : 255 * (1 - m) * (1 - k);
      b = y >= 1 ? 0 : 255 * (1 - y) * (1 - k);
      return [r, g, b, alpha];
    };

    _input.cmyk = function() {
      return cmyk2rgb(unpack(arguments));
    };

    chroma.cmyk = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['cmyk']), function(){});
    };

    Color.prototype.cmyk = function() {
      return rgb2cmyk(this._rgb);
    };

    _input.gl = function() {
      var i, k, o, rgb, v;
      rgb = (function() {
        var ref, results;
        ref = unpack(arguments);
        results = [];
        for (k in ref) {
          v = ref[k];
          results.push(v);
        }
        return results;
      }).apply(this, arguments);
      for (i = o = 0; o <= 2; i = ++o) {
        rgb[i] *= 255;
      }
      return rgb;
    };

    chroma.gl = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['gl']), function(){});
    };

    Color.prototype.gl = function() {
      var rgb;
      rgb = this._rgb;
      return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, rgb[3]];
    };

    rgb2luminance = function(r, g, b) {
      var ref;
      ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
      r = luminance_x(r);
      g = luminance_x(g);
      b = luminance_x(b);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    luminance_x = function(x) {
      x /= 255;
      if (x <= 0.03928) {
        return x / 12.92;
      } else {
        return pow((x + 0.055) / 1.055, 2.4);
      }
    };

    interpolate_rgb = function(col1, col2, f, m) {
      var xyz0, xyz1;
      xyz0 = col1._rgb;
      xyz1 = col2._rgb;
      return new Color(xyz0[0] + f * (xyz1[0] - xyz0[0]), xyz0[1] + f * (xyz1[1] - xyz0[1]), xyz0[2] + f * (xyz1[2] - xyz0[2]), m);
    };

    _interpolators.push(['rgb', interpolate_rgb]);

    Color.prototype.luminance = function(lum, mode) {
      var cur_lum, eps, max_iter, test;
      if (mode == null) {
        mode = 'rgb';
      }
      if (!arguments.length) {
        return rgb2luminance(this._rgb);
      }
      if (lum === 0) {
        this._rgb = [0, 0, 0, this._rgb[3]];
      } else if (lum === 1) {
        this._rgb = [255, 255, 255, this._rgb[3]];
      } else {
        eps = 1e-7;
        max_iter = 20;
        test = function(l, h) {
          var lm, m;
          m = l.interpolate(h, 0.5, mode);
          lm = m.luminance();
          if (Math.abs(lum - lm) < eps || !max_iter--) {
            return m;
          }
          if (lm > lum) {
            return test(l, m);
          }
          return test(m, h);
        };
        cur_lum = rgb2luminance(this._rgb);
        this._rgb = (cur_lum > lum ? test(chroma('black'), this) : test(this, chroma('white'))).rgba();
      }
      return this;
    };

    temperature2rgb = function(kelvin) {
      var b, g, r, temp;
      temp = kelvin / 100;
      if (temp < 66) {
        r = 255;
        g = -155.25485562709179 - 0.44596950469579133 * (g = temp - 2) + 104.49216199393888 * log(g);
        b = temp < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (b = temp - 10) + 115.67994401066147 * log(b);
      } else {
        r = 351.97690566805693 + 0.114206453784165 * (r = temp - 55) - 40.25366309332127 * log(r);
        g = 325.4494125711974 + 0.07943456536662342 * (g = temp - 50) - 28.0852963507957 * log(g);
        b = 255;
      }
      return [r, g, b];
    };

    rgb2temperature = function() {
      var b, eps, g, maxTemp, minTemp, r, ref, rgb, temp;
      ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
      minTemp = 1000;
      maxTemp = 40000;
      eps = 0.4;
      while (maxTemp - minTemp > eps) {
        temp = (maxTemp + minTemp) * 0.5;
        rgb = temperature2rgb(temp);
        if ((rgb[2] / rgb[0]) >= (b / r)) {
          maxTemp = temp;
        } else {
          minTemp = temp;
        }
      }
      return round(temp);
    };

    chroma.temperature = chroma.kelvin = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['temperature']), function(){});
    };

    _input.temperature = _input.kelvin = _input.K = temperature2rgb;

    Color.prototype.temperature = function() {
      return rgb2temperature(this._rgb);
    };

    Color.prototype.kelvin = Color.prototype.temperature;

    chroma.contrast = function(a, b) {
      var l1, l2, ref, ref1;
      if ((ref = type(a)) === 'string' || ref === 'number') {
        a = new Color(a);
      }
      if ((ref1 = type(b)) === 'string' || ref1 === 'number') {
        b = new Color(b);
      }
      l1 = a.luminance();
      l2 = b.luminance();
      if (l1 > l2) {
        return (l1 + 0.05) / (l2 + 0.05);
      } else {
        return (l2 + 0.05) / (l1 + 0.05);
      }
    };

    chroma.distance = function(a, b, mode) {
      var d, i, l1, l2, ref, ref1, sum_sq;
      if (mode == null) {
        mode = 'lab';
      }
      if ((ref = type(a)) === 'string' || ref === 'number') {
        a = new Color(a);
      }
      if ((ref1 = type(b)) === 'string' || ref1 === 'number') {
        b = new Color(b);
      }
      l1 = a.get(mode);
      l2 = b.get(mode);
      sum_sq = 0;
      for (i in l1) {
        d = (l1[i] || 0) - (l2[i] || 0);
        sum_sq += d * d;
      }
      return Math.sqrt(sum_sq);
    };

    chroma.deltaE = function(a, b, L, C) {
      var L1, L2, a1, a2, b1, b2, c1, c2, c4, dH2, delA, delB, delC, delL, f, h1, ref, ref1, ref2, ref3, sc, sh, sl, t, v1, v2, v3;
      if (L == null) {
        L = 1;
      }
      if (C == null) {
        C = 1;
      }
      if ((ref = type(a)) === 'string' || ref === 'number') {
        a = new Color(a);
      }
      if ((ref1 = type(b)) === 'string' || ref1 === 'number') {
        b = new Color(b);
      }
      ref2 = a.lab(), L1 = ref2[0], a1 = ref2[1], b1 = ref2[2];
      ref3 = b.lab(), L2 = ref3[0], a2 = ref3[1], b2 = ref3[2];
      c1 = sqrt(a1 * a1 + b1 * b1);
      c2 = sqrt(a2 * a2 + b2 * b2);
      sl = L1 < 16.0 ? 0.511 : (0.040975 * L1) / (1.0 + 0.01765 * L1);
      sc = (0.0638 * c1) / (1.0 + 0.0131 * c1) + 0.638;
      h1 = c1 < 0.000001 ? 0.0 : (atan2(b1, a1) * 180.0) / PI;
      while (h1 < 0) {
        h1 += 360;
      }
      while (h1 >= 360) {
        h1 -= 360;
      }
      t = (h1 >= 164.0) && (h1 <= 345.0) ? 0.56 + abs(0.2 * cos((PI * (h1 + 168.0)) / 180.0)) : 0.36 + abs(0.4 * cos((PI * (h1 + 35.0)) / 180.0));
      c4 = c1 * c1 * c1 * c1;
      f = sqrt(c4 / (c4 + 1900.0));
      sh = sc * (f * t + 1.0 - f);
      delL = L1 - L2;
      delC = c1 - c2;
      delA = a1 - a2;
      delB = b1 - b2;
      dH2 = delA * delA + delB * delB - delC * delC;
      v1 = delL / (L * sl);
      v2 = delC / (C * sc);
      v3 = sh;
      return sqrt(v1 * v1 + v2 * v2 + (dH2 / (v3 * v3)));
    };

    Color.prototype.get = function(modechan) {
      var channel, i, me, mode, ref, src;
      me = this;
      ref = modechan.split('.'), mode = ref[0], channel = ref[1];
      src = me[mode]();
      if (channel) {
        i = mode.indexOf(channel);
        if (i > -1) {
          return src[i];
        } else {
          return console.warn('unknown channel ' + channel + ' in mode ' + mode);
        }
      } else {
        return src;
      }
    };

    Color.prototype.set = function(modechan, value) {
      var channel, i, me, mode, ref, src;
      me = this;
      ref = modechan.split('.'), mode = ref[0], channel = ref[1];
      if (channel) {
        src = me[mode]();
        i = mode.indexOf(channel);
        if (i > -1) {
          if (type(value) === 'string') {
            switch (value.charAt(0)) {
              case '+':
                src[i] += +value;
                break;
              case '-':
                src[i] += +value;
                break;
              case '*':
                src[i] *= +(value.substr(1));
                break;
              case '/':
                src[i] /= +(value.substr(1));
                break;
              default:
                src[i] = +value;
            }
          } else {
            src[i] = value;
          }
        } else {
          console.warn('unknown channel ' + channel + ' in mode ' + mode);
        }
      } else {
        src = value;
      }
      return chroma(src, mode).alpha(me.alpha());
    };

    Color.prototype.clipped = function() {
      return this._rgb._clipped || false;
    };

    Color.prototype.alpha = function(a) {
      if (arguments.length) {
        return chroma.rgb([this._rgb[0], this._rgb[1], this._rgb[2], a]);
      }
      return this._rgb[3];
    };

    Color.prototype.darken = function(amount) {
      var lab, me;
      if (amount == null) {
        amount = 1;
      }
      me = this;
      lab = me.lab();
      lab[0] -= LAB_CONSTANTS.Kn * amount;
      return chroma.lab(lab).alpha(me.alpha());
    };

    Color.prototype.brighten = function(amount) {
      if (amount == null) {
        amount = 1;
      }
      return this.darken(-amount);
    };

    Color.prototype.darker = Color.prototype.darken;

    Color.prototype.brighter = Color.prototype.brighten;

    Color.prototype.saturate = function(amount) {
      var lch, me;
      if (amount == null) {
        amount = 1;
      }
      me = this;
      lch = me.lch();
      lch[1] += amount * LAB_CONSTANTS.Kn;
      if (lch[1] < 0) {
        lch[1] = 0;
      }
      return chroma.lch(lch).alpha(me.alpha());
    };

    Color.prototype.desaturate = function(amount) {
      if (amount == null) {
        amount = 1;
      }
      return this.saturate(-amount);
    };

    Color.prototype.premultiply = function() {
      var a, rgb;
      rgb = this.rgb();
      a = this.alpha();
      return chroma(rgb[0] * a, rgb[1] * a, rgb[2] * a, a);
    };

    blend = function(bottom, top, mode) {
      if (!blend[mode]) {
        throw 'unknown blend mode ' + mode;
      }
      return blend[mode](bottom, top);
    };

    blend_f = function(f) {
      return function(bottom, top) {
        var c0, c1;
        c0 = chroma(top).rgb();
        c1 = chroma(bottom).rgb();
        return chroma(f(c0, c1), 'rgb');
      };
    };

    each = function(f) {
      return function(c0, c1) {
        var i, o, out;
        out = [];
        for (i = o = 0; o <= 3; i = ++o) {
          out[i] = f(c0[i], c1[i]);
        }
        return out;
      };
    };

    normal = function(a, b) {
      return a;
    };

    multiply = function(a, b) {
      return a * b / 255;
    };

    darken = function(a, b) {
      if (a > b) {
        return b;
      } else {
        return a;
      }
    };

    lighten = function(a, b) {
      if (a > b) {
        return a;
      } else {
        return b;
      }
    };

    screen = function(a, b) {
      return 255 * (1 - (1 - a / 255) * (1 - b / 255));
    };

    overlay = function(a, b) {
      if (b < 128) {
        return 2 * a * b / 255;
      } else {
        return 255 * (1 - 2 * (1 - a / 255) * (1 - b / 255));
      }
    };

    burn = function(a, b) {
      return 255 * (1 - (1 - b / 255) / (a / 255));
    };

    dodge = function(a, b) {
      if (a === 255) {
        return 255;
      }
      a = 255 * (b / 255) / (1 - a / 255);
      if (a > 255) {
        return 255;
      } else {
        return a;
      }
    };

    blend.normal = blend_f(each(normal));

    blend.multiply = blend_f(each(multiply));

    blend.screen = blend_f(each(screen));

    blend.overlay = blend_f(each(overlay));

    blend.darken = blend_f(each(darken));

    blend.lighten = blend_f(each(lighten));

    blend.dodge = blend_f(each(dodge));

    blend.burn = blend_f(each(burn));

    chroma.blend = blend;

    chroma.analyze = function(data) {
      var len, o, r, val;
      r = {
        min: Number.MAX_VALUE,
        max: Number.MAX_VALUE * -1,
        sum: 0,
        values: [],
        count: 0
      };
      for (o = 0, len = data.length; o < len; o++) {
        val = data[o];
        if ((val != null) && !isNaN(val)) {
          r.values.push(val);
          r.sum += val;
          if (val < r.min) {
            r.min = val;
          }
          if (val > r.max) {
            r.max = val;
          }
          r.count += 1;
        }
      }
      r.domain = [r.min, r.max];
      r.limits = function(mode, num) {
        return chroma.limits(r, mode, num);
      };
      return r;
    };

    chroma.scale = function(colors, positions) {
      var _classes, _colorCache, _colors, _correctLightness, _domain, _gamma, _max, _min, _mode, _nacol, _out, _padding, _pos, _spread, _useCache, f, getClass, getColor, resetCache, setColors, tmap;
      _mode = 'rgb';
      _nacol = chroma('#ccc');
      _spread = 0;
      _domain = [0, 1];
      _pos = [];
      _padding = [0, 0];
      _classes = false;
      _colors = [];
      _out = false;
      _min = 0;
      _max = 1;
      _correctLightness = false;
      _colorCache = {};
      _useCache = true;
      _gamma = 1;
      setColors = function(colors) {
        var c, col, o, ref, ref1, w;
        if (colors == null) {
          colors = ['#fff', '#000'];
        }
        if ((colors != null) && type(colors) === 'string' && (chroma.brewer != null)) {
          colors = chroma.brewer[colors] || chroma.brewer[colors.toLowerCase()] || colors;
        }
        if (type(colors) === 'array') {
          colors = colors.slice(0);
          for (c = o = 0, ref = colors.length - 1; 0 <= ref ? o <= ref : o >= ref; c = 0 <= ref ? ++o : --o) {
            col = colors[c];
            if (type(col) === "string") {
              colors[c] = chroma(col);
            }
          }
          _pos.length = 0;
          for (c = w = 0, ref1 = colors.length - 1; 0 <= ref1 ? w <= ref1 : w >= ref1; c = 0 <= ref1 ? ++w : --w) {
            _pos.push(c / (colors.length - 1));
          }
        }
        resetCache();
        return _colors = colors;
      };
      getClass = function(value) {
        var i, n;
        if (_classes != null) {
          n = _classes.length - 1;
          i = 0;
          while (i < n && value >= _classes[i]) {
            i++;
          }
          return i - 1;
        }
        return 0;
      };
      tmap = function(t) {
        return t;
      };
      getColor = function(val, bypassMap) {
        var c, col, i, k, o, p, ref, t;
        if (bypassMap == null) {
          bypassMap = false;
        }
        if (isNaN(val)) {
          return _nacol;
        }
        if (!bypassMap) {
          if (_classes && _classes.length > 2) {
            c = getClass(val);
            t = c / (_classes.length - 2);
          } else if (_max !== _min) {
            t = (val - _min) / (_max - _min);
          } else {
            t = 1;
          }
        } else {
          t = val;
        }
        if (!bypassMap) {
          t = tmap(t);
        }
        if (_gamma !== 1) {
          t = pow(t, _gamma);
        }
        t = _padding[0] + (t * (1 - _padding[0] - _padding[1]));
        t = Math.min(1, Math.max(0, t));
        k = Math.floor(t * 10000);
        if (_useCache && _colorCache[k]) {
          col = _colorCache[k];
        } else {
          if (type(_colors) === 'array') {
            for (i = o = 0, ref = _pos.length - 1; 0 <= ref ? o <= ref : o >= ref; i = 0 <= ref ? ++o : --o) {
              p = _pos[i];
              if (t <= p) {
                col = _colors[i];
                break;
              }
              if (t >= p && i === _pos.length - 1) {
                col = _colors[i];
                break;
              }
              if (t > p && t < _pos[i + 1]) {
                t = (t - p) / (_pos[i + 1] - p);
                col = chroma.interpolate(_colors[i], _colors[i + 1], t, _mode);
                break;
              }
            }
          } else if (type(_colors) === 'function') {
            col = _colors(t);
          }
          if (_useCache) {
            _colorCache[k] = col;
          }
        }
        return col;
      };
      resetCache = function() {
        return _colorCache = {};
      };
      setColors(colors);
      f = function(v) {
        var c;
        c = chroma(getColor(v));
        if (_out && c[_out]) {
          return c[_out]();
        } else {
          return c;
        }
      };
      f.classes = function(classes) {
        var d;
        if (classes != null) {
          if (type(classes) === 'array') {
            _classes = classes;
            _domain = [classes[0], classes[classes.length - 1]];
          } else {
            d = chroma.analyze(_domain);
            if (classes === 0) {
              _classes = [d.min, d.max];
            } else {
              _classes = chroma.limits(d, 'e', classes);
            }
          }
          return f;
        }
        return _classes;
      };
      f.domain = function(domain) {
        var c, d, k, len, o, ref, w;
        if (!arguments.length) {
          return _domain;
        }
        _min = domain[0];
        _max = domain[domain.length - 1];
        _pos = [];
        k = _colors.length;
        if (domain.length === k && _min !== _max) {
          for (o = 0, len = domain.length; o < len; o++) {
            d = domain[o];
            _pos.push((d - _min) / (_max - _min));
          }
        } else {
          for (c = w = 0, ref = k - 1; 0 <= ref ? w <= ref : w >= ref; c = 0 <= ref ? ++w : --w) {
            _pos.push(c / (k - 1));
          }
        }
        _domain = [_min, _max];
        return f;
      };
      f.mode = function(_m) {
        if (!arguments.length) {
          return _mode;
        }
        _mode = _m;
        resetCache();
        return f;
      };
      f.range = function(colors, _pos) {
        setColors(colors, _pos);
        return f;
      };
      f.out = function(_o) {
        _out = _o;
        return f;
      };
      f.spread = function(val) {
        if (!arguments.length) {
          return _spread;
        }
        _spread = val;
        return f;
      };
      f.correctLightness = function(v) {
        if (v == null) {
          v = true;
        }
        _correctLightness = v;
        resetCache();
        if (_correctLightness) {
          tmap = function(t) {
            var L0, L1, L_actual, L_diff, L_ideal, max_iter, pol, t0, t1;
            L0 = getColor(0, true).lab()[0];
            L1 = getColor(1, true).lab()[0];
            pol = L0 > L1;
            L_actual = getColor(t, true).lab()[0];
            L_ideal = L0 + (L1 - L0) * t;
            L_diff = L_actual - L_ideal;
            t0 = 0;
            t1 = 1;
            max_iter = 20;
            while (Math.abs(L_diff) > 1e-2 && max_iter-- > 0) {
              (function() {
                if (pol) {
                  L_diff *= -1;
                }
                if (L_diff < 0) {
                  t0 = t;
                  t += (t1 - t) * 0.5;
                } else {
                  t1 = t;
                  t += (t0 - t) * 0.5;
                }
                L_actual = getColor(t, true).lab()[0];
                return L_diff = L_actual - L_ideal;
              })();
            }
            return t;
          };
        } else {
          tmap = function(t) {
            return t;
          };
        }
        return f;
      };
      f.padding = function(p) {
        if (p != null) {
          if (type(p) === 'number') {
            p = [p, p];
          }
          _padding = p;
          return f;
        } else {
          return _padding;
        }
      };
      f.colors = function(numColors, out) {
        var dd, dm, i, ref, result, results, samples, w;
        if (arguments.length < 2) {
          out = 'hex';
        }
        result = [];
        if (arguments.length === 0) {
          result = _colors.slice(0);
        } else if (numColors === 1) {
          result = [f(0.5)];
        } else if (numColors > 1) {
          dm = _domain[0];
          dd = _domain[1] - dm;
          result = (function() {
            results = [];
            for (var o = 0; 0 <= numColors ? o < numColors : o > numColors; 0 <= numColors ? o++ : o--){ results.push(o); }
            return results;
          }).apply(this).map(function(i) {
            return f(dm + i / (numColors - 1) * dd);
          });
        } else {
          colors = [];
          samples = [];
          if (_classes && _classes.length > 2) {
            for (i = w = 1, ref = _classes.length; 1 <= ref ? w < ref : w > ref; i = 1 <= ref ? ++w : --w) {
              samples.push((_classes[i - 1] + _classes[i]) * 0.5);
            }
          } else {
            samples = _domain;
          }
          result = samples.map(function(v) {
            return f(v);
          });
        }
        if (chroma[out]) {
          result = result.map(function(c) {
            return c[out]();
          });
        }
        return result;
      };
      f.cache = function(c) {
        if (c != null) {
          _useCache = c;
          return f;
        } else {
          return _useCache;
        }
      };
      f.gamma = function(g) {
        if (g != null) {
          _gamma = g;
          return f;
        } else {
          return _gamma;
        }
      };
      return f;
    };

    if (chroma.scales == null) {
      chroma.scales = {};
    }

    chroma.scales.cool = function() {
      return chroma.scale([chroma.hsl(180, 1, .9), chroma.hsl(250, .7, .4)]);
    };

    chroma.scales.hot = function() {
      return chroma.scale(['#000', '#f00', '#ff0', '#fff'], [0, .25, .75, 1]).mode('rgb');
    };

    chroma.analyze = function(data, key, filter) {
      var add, k, len, o, r, val, visit;
      r = {
        min: Number.MAX_VALUE,
        max: Number.MAX_VALUE * -1,
        sum: 0,
        values: [],
        count: 0
      };
      if (filter == null) {
        filter = function() {
          return true;
        };
      }
      add = function(val) {
        if ((val != null) && !isNaN(val)) {
          r.values.push(val);
          r.sum += val;
          if (val < r.min) {
            r.min = val;
          }
          if (val > r.max) {
            r.max = val;
          }
          r.count += 1;
        }
      };
      visit = function(val, k) {
        if (filter(val, k)) {
          if ((key != null) && type(key) === 'function') {
            return add(key(val));
          } else if ((key != null) && type(key) === 'string' || type(key) === 'number') {
            return add(val[key]);
          } else {
            return add(val);
          }
        }
      };
      if (type(data) === 'array') {
        for (o = 0, len = data.length; o < len; o++) {
          val = data[o];
          visit(val);
        }
      } else {
        for (k in data) {
          val = data[k];
          visit(val, k);
        }
      }
      r.domain = [r.min, r.max];
      r.limits = function(mode, num) {
        return chroma.limits(r, mode, num);
      };
      return r;
    };

    chroma.limits = function(data, mode, num) {
      var aa, ab, ac, ad, ae, af, ag, ah, ai, aj, ak, al, am, assignments, best, centroids, cluster, clusterSizes, dist, i, j, kClusters, limits, max_log, min, min_log, mindist, n, nb_iters, newCentroids, o, p, pb, pr, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, repeat, sum, tmpKMeansBreaks, v, value, values, w;
      if (mode == null) {
        mode = 'equal';
      }
      if (num == null) {
        num = 7;
      }
      if (type(data) === 'array') {
        data = chroma.analyze(data);
      }
      min = data.min;
      max = data.max;
      sum = data.sum;
      values = data.values.sort(function(a, b) {
        return a - b;
      });
      if (num === 1) {
        return [min, max];
      }
      limits = [];
      if (mode.substr(0, 1) === 'c') {
        limits.push(min);
        limits.push(max);
      }
      if (mode.substr(0, 1) === 'e') {
        limits.push(min);
        for (i = o = 1, ref = num - 1; 1 <= ref ? o <= ref : o >= ref; i = 1 <= ref ? ++o : --o) {
          limits.push(min + (i / num) * (max - min));
        }
        limits.push(max);
      } else if (mode.substr(0, 1) === 'l') {
        if (min <= 0) {
          throw 'Logarithmic scales are only possible for values > 0';
        }
        min_log = Math.LOG10E * log(min);
        max_log = Math.LOG10E * log(max);
        limits.push(min);
        for (i = w = 1, ref1 = num - 1; 1 <= ref1 ? w <= ref1 : w >= ref1; i = 1 <= ref1 ? ++w : --w) {
          limits.push(pow(10, min_log + (i / num) * (max_log - min_log)));
        }
        limits.push(max);
      } else if (mode.substr(0, 1) === 'q') {
        limits.push(min);
        for (i = aa = 1, ref2 = num - 1; 1 <= ref2 ? aa <= ref2 : aa >= ref2; i = 1 <= ref2 ? ++aa : --aa) {
          p = (values.length - 1) * i / num;
          pb = floor(p);
          if (pb === p) {
            limits.push(values[pb]);
          } else {
            pr = p - pb;
            limits.push(values[pb] * (1 - pr) + values[pb + 1] * pr);
          }
        }
        limits.push(max);
      } else if (mode.substr(0, 1) === 'k') {

        /*
        implementation based on
        http://code.google.com/p/figue/source/browse/trunk/figue.js#336
        simplified for 1-d input values
         */
        n = values.length;
        assignments = new Array(n);
        clusterSizes = new Array(num);
        repeat = true;
        nb_iters = 0;
        centroids = null;
        centroids = [];
        centroids.push(min);
        for (i = ab = 1, ref3 = num - 1; 1 <= ref3 ? ab <= ref3 : ab >= ref3; i = 1 <= ref3 ? ++ab : --ab) {
          centroids.push(min + (i / num) * (max - min));
        }
        centroids.push(max);
        while (repeat) {
          for (j = ac = 0, ref4 = num - 1; 0 <= ref4 ? ac <= ref4 : ac >= ref4; j = 0 <= ref4 ? ++ac : --ac) {
            clusterSizes[j] = 0;
          }
          for (i = ad = 0, ref5 = n - 1; 0 <= ref5 ? ad <= ref5 : ad >= ref5; i = 0 <= ref5 ? ++ad : --ad) {
            value = values[i];
            mindist = Number.MAX_VALUE;
            for (j = ae = 0, ref6 = num - 1; 0 <= ref6 ? ae <= ref6 : ae >= ref6; j = 0 <= ref6 ? ++ae : --ae) {
              dist = abs(centroids[j] - value);
              if (dist < mindist) {
                mindist = dist;
                best = j;
              }
            }
            clusterSizes[best]++;
            assignments[i] = best;
          }
          newCentroids = new Array(num);
          for (j = af = 0, ref7 = num - 1; 0 <= ref7 ? af <= ref7 : af >= ref7; j = 0 <= ref7 ? ++af : --af) {
            newCentroids[j] = null;
          }
          for (i = ag = 0, ref8 = n - 1; 0 <= ref8 ? ag <= ref8 : ag >= ref8; i = 0 <= ref8 ? ++ag : --ag) {
            cluster = assignments[i];
            if (newCentroids[cluster] === null) {
              newCentroids[cluster] = values[i];
            } else {
              newCentroids[cluster] += values[i];
            }
          }
          for (j = ah = 0, ref9 = num - 1; 0 <= ref9 ? ah <= ref9 : ah >= ref9; j = 0 <= ref9 ? ++ah : --ah) {
            newCentroids[j] *= 1 / clusterSizes[j];
          }
          repeat = false;
          for (j = ai = 0, ref10 = num - 1; 0 <= ref10 ? ai <= ref10 : ai >= ref10; j = 0 <= ref10 ? ++ai : --ai) {
            if (newCentroids[j] !== centroids[i]) {
              repeat = true;
              break;
            }
          }
          centroids = newCentroids;
          nb_iters++;
          if (nb_iters > 200) {
            repeat = false;
          }
        }
        kClusters = {};
        for (j = aj = 0, ref11 = num - 1; 0 <= ref11 ? aj <= ref11 : aj >= ref11; j = 0 <= ref11 ? ++aj : --aj) {
          kClusters[j] = [];
        }
        for (i = ak = 0, ref12 = n - 1; 0 <= ref12 ? ak <= ref12 : ak >= ref12; i = 0 <= ref12 ? ++ak : --ak) {
          cluster = assignments[i];
          kClusters[cluster].push(values[i]);
        }
        tmpKMeansBreaks = [];
        for (j = al = 0, ref13 = num - 1; 0 <= ref13 ? al <= ref13 : al >= ref13; j = 0 <= ref13 ? ++al : --al) {
          tmpKMeansBreaks.push(kClusters[j][0]);
          tmpKMeansBreaks.push(kClusters[j][kClusters[j].length - 1]);
        }
        tmpKMeansBreaks = tmpKMeansBreaks.sort(function(a, b) {
          return a - b;
        });
        limits.push(tmpKMeansBreaks[0]);
        for (i = am = 1, ref14 = tmpKMeansBreaks.length - 1; am <= ref14; i = am += 2) {
          v = tmpKMeansBreaks[i];
          if (!isNaN(v) && limits.indexOf(v) === -1) {
            limits.push(v);
          }
        }
      }
      return limits;
    };

    hsi2rgb = function(h, s, i) {

      /*
      borrowed from here:
      http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/hsi2rgb.cpp
       */
      var args, b, g, r;
      args = unpack(arguments);
      h = args[0], s = args[1], i = args[2];
      if (isNaN(h)) {
        h = 0;
      }
      h /= 360;
      if (h < 1 / 3) {
        b = (1 - s) / 3;
        r = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
        g = 1 - (b + r);
      } else if (h < 2 / 3) {
        h -= 1 / 3;
        r = (1 - s) / 3;
        g = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
        b = 1 - (r + g);
      } else {
        h -= 2 / 3;
        g = (1 - s) / 3;
        b = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
        r = 1 - (g + b);
      }
      r = limit(i * r * 3);
      g = limit(i * g * 3);
      b = limit(i * b * 3);
      return [r * 255, g * 255, b * 255, args.length > 3 ? args[3] : 1];
    };

    rgb2hsi = function() {

      /*
      borrowed from here:
      http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/rgb2hsi.cpp
       */
      var b, g, h, i, min, r, ref, s;
      ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
      TWOPI = Math.PI * 2;
      r /= 255;
      g /= 255;
      b /= 255;
      min = Math.min(r, g, b);
      i = (r + g + b) / 3;
      s = 1 - min / i;
      if (s === 0) {
        h = 0;
      } else {
        h = ((r - g) + (r - b)) / 2;
        h /= Math.sqrt((r - g) * (r - g) + (r - b) * (g - b));
        h = Math.acos(h);
        if (b > g) {
          h = TWOPI - h;
        }
        h /= TWOPI;
      }
      return [h * 360, s, i];
    };

    chroma.hsi = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Color, slice.call(arguments).concat(['hsi']), function(){});
    };

    _input.hsi = hsi2rgb;

    Color.prototype.hsi = function() {
      return rgb2hsi(this._rgb);
    };

    interpolate_hsx = function(col1, col2, f, m) {
      var dh, hue, hue0, hue1, lbv, lbv0, lbv1, res, sat, sat0, sat1, xyz0, xyz1;
      if (m === 'hsl') {
        xyz0 = col1.hsl();
        xyz1 = col2.hsl();
      } else if (m === 'hsv') {
        xyz0 = col1.hsv();
        xyz1 = col2.hsv();
      } else if (m === 'hcg') {
        xyz0 = col1.hcg();
        xyz1 = col2.hcg();
      } else if (m === 'hsi') {
        xyz0 = col1.hsi();
        xyz1 = col2.hsi();
      } else if (m === 'lch' || m === 'hcl') {
        m = 'hcl';
        xyz0 = col1.hcl();
        xyz1 = col2.hcl();
      }
      if (m.substr(0, 1) === 'h') {
        hue0 = xyz0[0], sat0 = xyz0[1], lbv0 = xyz0[2];
        hue1 = xyz1[0], sat1 = xyz1[1], lbv1 = xyz1[2];
      }
      if (!isNaN(hue0) && !isNaN(hue1)) {
        if (hue1 > hue0 && hue1 - hue0 > 180) {
          dh = hue1 - (hue0 + 360);
        } else if (hue1 < hue0 && hue0 - hue1 > 180) {
          dh = hue1 + 360 - hue0;
        } else {
          dh = hue1 - hue0;
        }
        hue = hue0 + f * dh;
      } else if (!isNaN(hue0)) {
        hue = hue0;
        if ((lbv1 === 1 || lbv1 === 0) && m !== 'hsv') {
          sat = sat0;
        }
      } else if (!isNaN(hue1)) {
        hue = hue1;
        if ((lbv0 === 1 || lbv0 === 0) && m !== 'hsv') {
          sat = sat1;
        }
      } else {
        hue = Number.NaN;
      }
      if (sat == null) {
        sat = sat0 + f * (sat1 - sat0);
      }
      lbv = lbv0 + f * (lbv1 - lbv0);
      return res = chroma[m](hue, sat, lbv);
    };

    _interpolators = _interpolators.concat((function() {
      var len, o, ref, results;
      ref = ['hsv', 'hsl', 'hsi', 'hcl', 'lch', 'hcg'];
      results = [];
      for (o = 0, len = ref.length; o < len; o++) {
        m = ref[o];
        results.push([m, interpolate_hsx]);
      }
      return results;
    })());

    interpolate_num = function(col1, col2, f, m) {
      var n1, n2;
      n1 = col1.num();
      n2 = col2.num();
      return chroma.num(n1 + (n2 - n1) * f, 'num');
    };

    _interpolators.push(['num', interpolate_num]);

    interpolate_lab = function(col1, col2, f, m) {
      var res, xyz0, xyz1;
      xyz0 = col1.lab();
      xyz1 = col2.lab();
      return res = new Color(xyz0[0] + f * (xyz1[0] - xyz0[0]), xyz0[1] + f * (xyz1[1] - xyz0[1]), xyz0[2] + f * (xyz1[2] - xyz0[2]), m);
    };

    _interpolators.push(['lab', interpolate_lab]);

  }).call(commonjsGlobal);
  });

  function keepNumber(x){
    return x.replace(/[^\d.-]/g, "");
  }

  // modules

  function fillSubunits(){

  	var colorScheme = this.data.colorScheme,
  		tab = this.data.tab;

    // if there is a color scheme, use it to fill the subunits
    if (Object.keys(colorScheme) !== 0) {

    	// determine values to base the color scheme on
    	var values = [];
      for (var i = 0, n = tab.length; i < n; i++){
        values.push(+keepNumber(tab[i][colorScheme.property]));
      }

      var buckets = chroma.limits(values, colorScheme.mode, colorScheme.colors.length);

      // // Exposes DOM elements for styling.
      this.subunits.style("fill", function(d){
        
        var match = matchFromGeo(d);

        if (match.length == 0){
          return colorScheme.noData;
        }

        var color;
        for (var i = 0, n = buckets.length; i < n; i++){
          var value = +keepNumber(match[0][colorScheme.property]);
          if (value >= buckets[i] && value <= buckets[i + 1]){
            color = colorScheme.colors[i];
            break;
          }
        }

        return color;
        
      });

      function matchFromGeo(d){
        var out = [];
        for (var i = 0, n = tab.length; i < n; i++){
          if (tab[i].key == d.properties.key) {
            out.push(tab[i]);
            break;
          }
        }
        return out;
      }

    }

    return this;
  }

  // centers and zooms a projection
  function fitSize$1() {  
  	// check for geospatial data
    if (this.data.geo.length == 0) throw Error("You must pass TopoJSON data through swiftmap.geometry() before you can fit the map in its parent.");

    var data_object = this.data.geo.objects[Object.keys(this.data.geo.objects)[0]];
    this.projection.fitSize([this.width, this.height], feature(this.data.geo, data_object));
    return this;
  }

  var xhtml$1 = "http://www.w3.org/1999/xhtml";

  var namespaces$1 = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: xhtml$1,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  function namespace$1(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces$1.hasOwnProperty(prefix) ? {space: namespaces$1[prefix], local: name} : name;
  }

  function creatorInherit$1(name) {
    return function() {
      var document = this.ownerDocument,
          uri = this.namespaceURI;
      return uri === xhtml$1 && document.documentElement.namespaceURI === xhtml$1
          ? document.createElement(name)
          : document.createElementNS(uri, name);
    };
  }

  function creatorFixed$1(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator$1(name) {
    var fullname = namespace$1(name);
    return (fullname.local
        ? creatorFixed$1
        : creatorInherit$1)(fullname);
  }

  function none$1() {}

  function selector$1(selector) {
    return selector == null ? none$1 : function() {
      return this.querySelector(selector);
    };
  }

  function selection_select$1(select) {
    if (typeof select !== "function") select = selector$1(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection$2(subgroups, this._parents);
  }

  function empty$1() {
    return [];
  }

  function selectorAll$1(selector) {
    return selector == null ? empty$1 : function() {
      return this.querySelectorAll(selector);
    };
  }

  function selection_selectAll$1(select) {
    if (typeof select !== "function") select = selectorAll$1(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection$2(subgroups, parents);
  }

  var matcher$2 = function(selector) {
    return function() {
      return this.matches(selector);
    };
  };

  if (typeof document !== "undefined") {
    var element$2 = document.documentElement;
    if (!element$2.matches) {
      var vendorMatches$1 = element$2.webkitMatchesSelector
          || element$2.msMatchesSelector
          || element$2.mozMatchesSelector
          || element$2.oMatchesSelector;
      matcher$2 = function(selector) {
        return function() {
          return vendorMatches$1.call(this, selector);
        };
      };
    }
  }

  var matcher$3 = matcher$2;

  function selection_filter$1(match) {
    if (typeof match !== "function") match = matcher$3(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection$2(subgroups, this._parents);
  }

  function sparse$1(update) {
    return new Array(update.length);
  }

  function selection_enter$1() {
    return new Selection$2(this._enter || this._groups.map(sparse$1), this._parents);
  }

  function EnterNode$1(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode$1.prototype = {
    constructor: EnterNode$1,
    appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
    insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
    querySelector: function(selector) { return this._parent.querySelector(selector); },
    querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
  };

  function constant$4(x) {
    return function() {
      return x;
    };
  }

  var keyPrefix$1 = "$"; // Protect against keys like “__proto__”.

  function bindIndex$1(parent, group, enter, update, exit, data) {
    var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode$1(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey$1(parent, group, enter, update, exit, data, key) {
    var i,
        node,
        nodeByKeyValue = {},
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = keyPrefix$1 + key.call(node, node.__data__, i, group);
        if (keyValue in nodeByKeyValue) {
          exit[i] = node;
        } else {
          nodeByKeyValue[keyValue] = node;
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = keyPrefix$1 + key.call(parent, data[i], i, data);
      if (node = nodeByKeyValue[keyValue]) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue[keyValue] = null;
      } else {
        enter[i] = new EnterNode$1(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
        exit[i] = node;
      }
    }
  }

  function selection_data$1(value, key) {
    if (!value) {
      data = new Array(this.size()), j = -1;
      this.each(function(d) { data[++j] = d; });
      return data;
    }

    var bind = key ? bindKey$1 : bindIndex$1,
        parents = this._parents,
        groups = this._groups;

    if (typeof value !== "function") value = constant$4(value);

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = value.call(parent, parent && parent.__data__, j, parents),
          dataLength = data.length,
          enterGroup = enter[j] = new Array(dataLength),
          updateGroup = update[j] = new Array(dataLength),
          exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null;
        }
      }
    }

    update = new Selection$2(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  function selection_exit$1() {
    return new Selection$2(this._exit || this._groups.map(sparse$1), this._parents);
  }

  function selection_merge$1(selection) {

    for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection$2(merges, this._parents);
  }

  function selection_order$1() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort$1(compare) {
    if (!compare) compare = ascending$2;

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection$2(sortgroups, this._parents).order();
  }

  function ascending$2(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call$1() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes$1() {
    var nodes = new Array(this.size()), i = -1;
    this.each(function() { nodes[++i] = this; });
    return nodes;
  }

  function selection_node$1() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }

    return null;
  }

  function selection_size$1() {
    var size = 0;
    this.each(function() { ++size; });
    return size;
  }

  function selection_empty$1() {
    return !this.node();
  }

  function selection_each$1(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }

    return this;
  }

  function attrRemove$2(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS$2(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant$2(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS$2(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction$2(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }

  function attrFunctionNS$2(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }

  function selection_attr$1(name, value) {
    var fullname = namespace$1(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
    }

    return this.each((value == null
        ? (fullname.local ? attrRemoveNS$2 : attrRemove$2) : (typeof value === "function"
        ? (fullname.local ? attrFunctionNS$2 : attrFunction$2)
        : (fullname.local ? attrConstantNS$2 : attrConstant$2)))(fullname, value));
  }

  function defaultView$1(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView; // node is a Document
  }

  function styleRemove$2(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant$2(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction$2(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }

  function selection_style$1(name, value, priority) {
    return arguments.length > 1
        ? this.each((value == null
              ? styleRemove$2 : typeof value === "function"
              ? styleFunction$2
              : styleConstant$2)(name, value, priority == null ? "" : priority))
        : styleValue$1(this.node(), name);
  }

  function styleValue$1(node, name) {
    return node.style.getPropertyValue(name)
        || defaultView$1(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  function propertyRemove$1(name) {
    return function() {
      delete this[name];
    };
  }

  function propertyConstant$1(name, value) {
    return function() {
      this[name] = value;
    };
  }

  function propertyFunction$1(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }

  function selection_property$1(name, value) {
    return arguments.length > 1
        ? this.each((value == null
            ? propertyRemove$1 : typeof value === "function"
            ? propertyFunction$1
            : propertyConstant$1)(name, value))
        : this.node()[name];
  }

  function classArray$1(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList$1(node) {
    return node.classList || new ClassList$1(node);
  }

  function ClassList$1(node) {
    this._node = node;
    this._names = classArray$1(node.getAttribute("class") || "");
  }

  ClassList$1.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };

  function classedAdd$1(node, names) {
    var list = classList$1(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }

  function classedRemove$1(node, names) {
    var list = classList$1(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }

  function classedTrue$1(names) {
    return function() {
      classedAdd$1(this, names);
    };
  }

  function classedFalse$1(names) {
    return function() {
      classedRemove$1(this, names);
    };
  }

  function classedFunction$1(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd$1 : classedRemove$1)(this, names);
    };
  }

  function selection_classed$1(name, value) {
    var names = classArray$1(name + "");

    if (arguments.length < 2) {
      var list = classList$1(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction$1 : value
        ? classedTrue$1
        : classedFalse$1)(names, value));
  }

  function textRemove$1() {
    this.textContent = "";
  }

  function textConstant$2(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction$2(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }

  function selection_text$1(value) {
    return arguments.length
        ? this.each(value == null
            ? textRemove$1 : (typeof value === "function"
            ? textFunction$2
            : textConstant$2)(value))
        : this.node().textContent;
  }

  function htmlRemove$1() {
    this.innerHTML = "";
  }

  function htmlConstant$1(value) {
    return function() {
      this.innerHTML = value;
    };
  }

  function htmlFunction$1(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }

  function selection_html$1(value) {
    return arguments.length
        ? this.each(value == null
            ? htmlRemove$1 : (typeof value === "function"
            ? htmlFunction$1
            : htmlConstant$1)(value))
        : this.node().innerHTML;
  }

  function raise$1() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }

  function selection_raise$1() {
    return this.each(raise$1);
  }

  function lower$1() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }

  function selection_lower$1() {
    return this.each(lower$1);
  }

  function selection_append$1(name) {
    var create = typeof name === "function" ? name : creator$1(name);
    return this.select(function() {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull$1() {
    return null;
  }

  function selection_insert$1(name, before) {
    var create = typeof name === "function" ? name : creator$1(name),
        select = before == null ? constantNull$1 : typeof before === "function" ? before : selector$1(before);
    return this.select(function() {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove$1() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }

  function selection_remove$1() {
    return this.each(remove$1);
  }

  function selection_cloneShallow$1() {
    return this.parentNode.insertBefore(this.cloneNode(false), this.nextSibling);
  }

  function selection_cloneDeep$1() {
    return this.parentNode.insertBefore(this.cloneNode(true), this.nextSibling);
  }

  function selection_clone$1(deep) {
    return this.select(deep ? selection_cloneDeep$1 : selection_cloneShallow$1);
  }

  function selection_datum$1(value) {
    return arguments.length
        ? this.property("__data__", value)
        : this.node().__data__;
  }

  var filterEvents$1 = {};

  if (typeof document !== "undefined") {
    var element$3 = document.documentElement;
    if (!("onmouseenter" in element$3)) {
      filterEvents$1 = {mouseenter: "mouseover", mouseleave: "mouseout"};
    }
  }

  function filterContextListener$1(listener, index, group) {
    listener = contextListener$1(listener, index, group);
    return function(event) {
      var related = event.relatedTarget;
      if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
        listener.call(this, event);
      }
    };
  }

  function contextListener$1(listener, index, group) {
    return function(event1) {
      try {
        listener.call(this, this.__data__, index, group);
      } finally {
      }
    };
  }

  function parseTypenames$2(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return {type: t, name: name};
    });
  }

  function onRemove$1(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }

  function onAdd$1(typename, value, capture) {
    var wrap = filterEvents$1.hasOwnProperty(typename.type) ? filterContextListener$1 : contextListener$1;
    return function(d, i, group) {
      var on = this.__on, o, listener = wrap(value, i, group);
      if (on) for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
          this.addEventListener(o.type, o.listener = listener, o.capture = capture);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, capture);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }

  function selection_on$1(typename, value, capture) {
    var typenames = parseTypenames$2(typename + ""), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }

    on = value ? onAdd$1 : onRemove$1;
    if (capture == null) capture = false;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
    return this;
  }

  function dispatchEvent$1(node, type, params) {
    var window = defaultView$1(node),
        event = window.CustomEvent;

    if (typeof event === "function") {
      event = new event(type, params);
    } else {
      event = window.document.createEvent("Event");
      if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type, false, false);
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant$1(type, params) {
    return function() {
      return dispatchEvent$1(this, type, params);
    };
  }

  function dispatchFunction$1(type, params) {
    return function() {
      return dispatchEvent$1(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch$1(type, params) {
    return this.each((typeof params === "function"
        ? dispatchFunction$1
        : dispatchConstant$1)(type, params));
  }

  var root$2 = [null];

  function Selection$2(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection$1() {
    return new Selection$2([[document.documentElement]], root$2);
  }

  Selection$2.prototype = selection$1.prototype = {
    constructor: Selection$2,
    select: selection_select$1,
    selectAll: selection_selectAll$1,
    filter: selection_filter$1,
    data: selection_data$1,
    enter: selection_enter$1,
    exit: selection_exit$1,
    merge: selection_merge$1,
    order: selection_order$1,
    sort: selection_sort$1,
    call: selection_call$1,
    nodes: selection_nodes$1,
    node: selection_node$1,
    size: selection_size$1,
    empty: selection_empty$1,
    each: selection_each$1,
    attr: selection_attr$1,
    style: selection_style$1,
    property: selection_property$1,
    classed: selection_classed$1,
    text: selection_text$1,
    html: selection_html$1,
    raise: selection_raise$1,
    lower: selection_lower$1,
    append: selection_append$1,
    insert: selection_insert$1,
    remove: selection_remove$1,
    clone: selection_clone$1,
    datum: selection_datum$1,
    on: selection_on$1,
    dispatch: selection_dispatch$1
  };

  function select$1(selector) {
    return typeof selector === "string"
        ? new Selection$2([[document.querySelector(selector)]], [document.documentElement])
        : new Selection$2([[selector]], root$2);
  }

  // modules

  // resizes the map
  function resize() {
    // size attributes
    this.width = this.parent == "body" ? window.innerWidth :
      +keepNumber(select$1(this.parent).style("width"));
    this.height = this.parent == "body" ? window.innerHeight :
      +keepNumber(select$1(this.parent).style("height"));
    this.svg.attr("width", this.width).attr("height", this.height);
    
    this.fitSize();

    this.svg.selectAll("path").attr("d", this.path);
    var projection = this.projection;
    this.svg.selectAll("text").attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; });
           
    return this;
  }

  // modules

  // Initializes a swiftmap
  function init$1(parent){

    // errors
    if (parent && typeof parent !== "string") throw TypeError("The argument passed to swiftmap.init() must be a string.");

    // parent
    this.parent = parent ? parent : "body";
    
    // projection
    this.projection = mercator();

    // size
    this.width = this.parent == "body" ? window.innerWidth :
      +keepNumber(select(this.parent).style("width"));
    this.height = this.parent == "body" ? window.innerHeight :
      +keepNumber(select(this.parent).style("height"));

    // derived attributes
    this.path = index().projection(this.projection);
    this.svg = select(this.parent).append("svg").attr("width", this.width).attr("height", this.height);

    // data object
    this.data = {
      geo: [],
      tab: [],
      colorScheme: {}
    };

    // keys object
    this.keys = {};

    // data functions
    this.geometry = geometry;
    this.data = data;

    // color scheme functions
    this.colorScheme = colorScheme;

    // draw functions
    this.draw = draw;
    this.drawBoundary = drawBoundary;
    this.drawSubunits = drawSubunits;
    this.fillSubunits = fillSubunits;
    this.fitSize = fitSize$1;
    this.resize = resize;

    return this;
  }

  exports.init = init$1;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
