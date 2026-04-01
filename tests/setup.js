/**
 * Test setup — provide minimal browser globals that source files
 * reference at the top level so they can be loaded via createRequire().
 */

/* Minimal jQuery mock — just enough for $(function(){}) document-ready */
if (typeof globalThis.$ === "undefined") {
  const noop = () => jqStub;
  const jqStub = Object.assign(noop, {
    append: noop,
    text: noop,
    html: noop,
    click: noop,
    attr: noop,
    val: noop,
    on: noop,
    find: noop,
    addClass: noop,
    removeClass: noop,
    closest: noop,
    each: noop,
  });
  globalThis.$ = function $(sel) {
    if (typeof sel === "function") {
      /* document-ready handler — skip in tests */
      return;
    }
    return jqStub;
  };
  globalThis.jQuery = globalThis.$;
}

/* Minimal swal/Swal mock */
if (typeof globalThis.swal === "undefined") {
  globalThis.swal = { fire: () => Promise.resolve({}) };
  globalThis.Swal = globalThis.swal;
}

/* Minimal ace mock */
if (typeof globalThis.ace === "undefined") {
  globalThis.ace = {
    edit: () => ({
      getValue: () => "",
      setValue: () => {},
      session: { setMode: () => {} },
    }),
  };
}
