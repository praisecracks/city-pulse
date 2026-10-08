import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "../../shared/Icon";

function Dropdown({ trigger, items, align = "right", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        if (triggerRef.current && !triggerRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleItemClick = (item, e) => {
    item.onClick?.(e);
    if (!item.keepOpen) setIsOpen(false);
  };

  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className={`fixed z-50 mt-1.5 rounded-xl bg-white border border-[#14232B]/10 shadow-lg py-1 min-w-[160px] ${align === "right" ? "right-0" : "left-0"}`}
      role="menu"
    >
      {items.map((item, index) => (
        item.divider ? (
          <hr key={`divider-${index}`} className="my-1 border-[#14232B]/10" />
        ) : (
          <button
            key={index}
            onClick={(e) => handleItemClick(item, e)}
            disabled={item.disabled}
            className={`w-full px-3 py-2 text-left text-sm text-[#14232B] hover:bg-[#F6F1E6] transition-colors ${item.disabled ? "opacity-50 cursor-not-allowed" : ""} ${item.className || ""}`}
            role="menuitem"
            tabIndex={-1}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className="text-[#14232B]/50">{item.icon}</span>}
              <span>{item.label}</span>
              {item.shortcut && <span className="ml-auto text-xs text-[#14232B]/40 font-mono">{item.shortcut}</span>}
            </div>
          </button>
        )
      ))}
    </div>
  ) : null;

  return (
    <div className="relative inline-block" ref={triggerRef}>
      {typeof trigger === "function" ? trigger({ isOpen, toggle: () => setIsOpen(!isOpen) }) : trigger}
      {createPortal(dropdownContent, document.body)}
    </div>
  );
}

function UserMenu({ user, onProfileClick, onSettingsClick, onLogoutClick }) {
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD";

  return (
    <Dropdown
      trigger={({ isOpen, toggle }) => (
        <button
          onClick={toggle}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#14232B]/5 transition-colors"
          aria-label="User menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="w-8 h-8 rounded-full bg-[#129E9E] flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
          <Icon name={isOpen ? "expand_less" : "expand_more"} size={18} className="text-[#14232B]/50 hidden sm:block" />
        </button>
      )}
      items={[
        { label: user?.name || "Administrator", disabled: true, className: "font-semibold px-3 py-2" },
        { label: user?.email || "admin@citypulse.com", disabled: true, className: "text-xs text-[#14232B]/50 px-3 pb-2" },
        { divider: true },
        { label: "Profile", icon: <Icon name="person" size={18} />, onClick: onProfileClick },
        { label: "Settings", icon: <Icon name="settings" size={18} />, onClick: onSettingsClick },
        { divider: true },
        { label: "Sign out", icon: <Icon name="logout" size={18} className="text-red-600" />, onClick: onLogoutClick, className: "text-red-600" },
      ]}
    />
  );
}

export { UserMenu };
export default Dropdown;