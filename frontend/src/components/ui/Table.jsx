import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * TABLE — the one data-table primitive for the console experiences.
 *
 * Used where a list is operated on rather than looked at (products, admins,
 * employees, branches, audit trail) — never for visual inspection grids
 * like the media library.
 *
 *   <Table caption="All products" headers={[{ label: "Product" }, …]}>
 *     <Table.Row>
 *       <Table.Cell>…</Table.Cell>
 *     </Table.Row>
 *   </Table>
 *
 * The wrapper scrolls horizontally before the page ever does, so a dense
 * table stays usable at narrow widths. `headers` styles the `<th>` row;
 * headers render with `scope="col"` and the table is always captioned for
 * screen readers (visually hidden when `hideCaption`).
 */
export default function Table({ caption, hideCaption = false, headers, children, className }) {
  return (
    <div className={cn("overflow-x-auto border border-border-default bg-surface-primary", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left">
        <caption
          className={cn(
            "px-panel py-3 text-left font-sans text-nav text-text-secondary",
            hideCaption && "sr-only"
          )}
        >
          {caption}
        </caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header.key ?? header.label}
                scope="col"
                className={cn(
                  "border-b border-border-default bg-surface-secondary px-4 py-3 font-sans text-label uppercase tracking-[0.18em] text-text-secondary first:pl-panel last:pr-panel",
                  header.align === "right" && "text-right",
                  header.align === "center" && "text-center",
                  header.className
                )}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function TableRow({ highlight = false, className, children, ...rest }) {
  return (
    <tr
      className={cn(
        "transition-colors duration-200",
        highlight && "bg-surface-secondary/60",
        className
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

function TableCell({ align = "left", className, children, ...rest }) {
  return (
    <td
      className={cn(
        "border-b border-border-subtle px-4 py-3.5 align-middle font-sans text-body-sm text-text-primary first:pl-panel last:pr-panel",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

Table.propTypes = {
  /** Accessible table name — required so the table is never anonymous. */
  caption: PropTypes.string.isRequired,
  /** Visually hide the caption while keeping it available to screen readers. */
  hideCaption: PropTypes.bool,
  headers: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.node.isRequired,
      align: PropTypes.oneOf(["left", "center", "right"]),
      className: PropTypes.string,
    })
  ).isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

TableRow.propTypes = {
  highlight: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

TableCell.propTypes = {
  align: PropTypes.oneOf(["left", "center", "right"]),
  className: PropTypes.string,
  children: PropTypes.node,
};

Table.Row = TableRow;
Table.Cell = TableCell;
