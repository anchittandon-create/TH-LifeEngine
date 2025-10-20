"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Chips } from "./Chips";
import styles from "./TypeaheadMulti.module.css";

interface Suggestion {
  id: string;
  label: string;
  category?: string;
}

interface TypeaheadMultiProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  maxSuggestions?: number;
  onSearch?: (query: string) => Promise<Suggestion[]>;
  className?: string;
}

export function TypeaheadMulti({
  value,
  onChange,
  suggestions,
  placeholder = "Type to search...",
  maxSuggestions = 10,
  onSearch,
  className = "",
}: TypeaheadMultiProps) {
  const [query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filterSuggestions = useCallback(async (searchQuery: string) => {
    if (onSearch) {
      const results = await onSearch(searchQuery);
      setFilteredSuggestions(results.slice(0, maxSuggestions));
    } else {
      const filtered = suggestions
        .filter(
          (suggestion) =>
            suggestion.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !value.includes(suggestion.id)
        )
        .slice(0, maxSuggestions);
      setFilteredSuggestions(filtered);
    }
  }, [suggestions, value, maxSuggestions, onSearch]);

  useEffect(() => {
    if (query.length > 0) {
      filterSuggestions(query);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  }, [query, filterSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        addItem(filteredSuggestions[selectedIndex].id);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const addItem = (itemId: string) => {
    if (!value.includes(itemId)) {
      onChange([...value, itemId]);
    }
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeItem = (itemId: string) => {
    onChange(value.filter((id) => id !== itemId));
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    addItem(suggestion.id);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`${styles.typeaheadMulti} ${className}`}>
      <Chips
        items={value}
        onRemove={removeItem}
        className={styles.typeaheadChips}
      />
      <div className={styles.typeaheadInputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowSuggestions(true)}
          placeholder={placeholder}
          className={styles.typeaheadInput}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div ref={suggestionsRef} className={styles.typeaheadSuggestions}>
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className={`${styles.typeaheadSuggestion} ${
                  index === selectedIndex ? styles.typeaheadSuggestionSelected : ""
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className={styles.typeaheadSuggestionLabel}>
                  {suggestion.label}
                </span>
                {suggestion.category && (
                  <span className={styles.typeaheadSuggestionCategory}>
                    {suggestion.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}