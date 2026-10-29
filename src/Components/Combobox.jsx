import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { rankMatches } from "../utils/geo";

const PAGE = 100; 

export default function Combobox({ label, items, value, onSelect, placeholder = "Select…", disabled = false, loading = false, emptyText = "No matches" }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [limit, setLimit] = useState(PAGE);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId();

  const matches = useMemo(() => (open ? rankMatches(items, q) : []), [open, items, q]);
  const shown = matches.slice(0, limit);
  const more = () => setLimit((l) => Math.min(l + PAGE, matches.length));

  useEffect(() => { setActive(0); setLimit(PAGE); }, [q, open]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);
  useEffect(() => {
    const away = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && (setOpen(false), setQ(""));
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const choose = (item) => { onSelect(item); setOpen(false); setQ(""); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      const next = Math.min(active + 1, matches.length - 1);
      setActive(next);
      if (next >= limit - 3) more(); // keep ahead of the arrow keys
    }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && open && shown[active]) { e.preventDefault(); choose(shown[active]); }
    else if (e.key === "Escape") { setOpen(false); setQ(""); }
  };

  return (
    <div className={`cbx ${disabled ? "is-disabled" : ""}`} ref={wrapRef}>
      <label className="cbx-label" htmlFor={`${uid}-in`}>{label}</label>
      <div className="cbx-field">
        <input
          id={`${uid}-in`}
          className="cbx-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-activedescendant={open && shown[active] ? `${uid}-o${active}` : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={loading ? "Loading…" : placeholder}
          value={open ? q : value?.name || ""}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={onKey}
        />
        {loading ? <span className="cbx-spin" /> : <ChevronDown size={15} className="cbx-chev" />}
      </div>
      {open && !disabled && (
        <ul
          className="cbx-list"
          role="listbox"
          id={`${uid}-list`}
          ref={listRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (limit < matches.length && el.scrollTop + el.clientHeight >= el.scrollHeight - 120) more(); // near the bottom: load the next rows
          }}
        >
          {shown.length === 0 && <li className="cbx-empty">{emptyText}</li>}
          {shown.map((it, i) => (
            <li
              key={it.key}
              id={`${uid}-o${i}`}
              role="option"
              aria-selected={i === active}
              className={`cbx-opt ${i === active ? "on" : ""} ${value?.key === it.key ? "picked" : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(it); }}
            >
              {it.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}