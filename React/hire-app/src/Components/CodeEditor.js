import React, { useRef } from "react";

/** Lightweight code editor: monospace textarea with Tab indentation and auto-indent. */
export default function CodeEditor({ value, onChange, minHeight = 360, blockPaste = false, onBlockedPaste, readOnly }) {
  const ref = useRef(null);

  const insert = (text, selectBack = 0) => {
    const el = ref.current;
    const { selectionStart: s, selectionEnd: e } = el;
    const next = value.slice(0, s) + text + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = s + text.length - selectBack;
    });
  };

  const onKeyDown = (ev) => {
    if (ev.key === "Tab") {
      ev.preventDefault();
      insert("    ");
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      const el = ref.current;
      const lineStart = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
      const line = value.slice(lineStart, el.selectionStart);
      let indent = line.match(/^\s*/)[0];
      if (/[{([:]\s*$/.test(line)) indent += "    ";
      insert("\n" + indent);
    }
  };

  return (
    <textarea
      ref={ref}
      className="code-editor mono"
      style={{ minHeight }}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      readOnly={readOnly}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onPaste={(e) => {
        if (blockPaste) {
          e.preventDefault();
          onBlockedPaste && onBlockedPaste();
        }
      }}
      onDrop={(e) => blockPaste && e.preventDefault()}
    />
  );
}
