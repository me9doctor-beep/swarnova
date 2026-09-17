import PropTypes from "prop-types";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";

/**
 * FILTER BAR — the console's search + select row.
 *
 * Wraps and stacks on narrow screens, sites one line on wide ones. Every
 * filter is a labelled Select; the search is a labelled Input with the
 * label visually implied by its placeholder — no, accessible labels are
 * required, so the Input receives one (it renders a real <label>).
 */
export default function FilterBar({
  searchValue = "",
  onSearchChange,
  searchLabel = "Search",
  searchPlaceholder = "Search…",
  filters = [],
  className = "",
}) {
  return (
    <div
      role="search"
      aria-label={searchLabel}
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end ${className}`}
    >
      {onSearchChange ? (
        <div className="sm:w-64">
          <Input
            size="sm"
            label={searchLabel}
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      ) : null}
      {filters.map((filter) => (
        <div key={filter.id} className="sm:w-44">
          <Select
            size="sm"
            label={filter.label}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ))}
    </div>
  );
}

FilterBar.propTypes = {
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchLabel: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      onChange: PropTypes.func.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
      ).isRequired,
    })
  ),
  className: PropTypes.string,
};
