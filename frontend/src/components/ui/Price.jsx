import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function Price({ amount, currency = "INR", className, tone = "ink" }) {
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
  return (
    <span
      className={cn(
        "font-sans text-[15px] tracking-wide",
        tone === "wine" ? "text-cream" : "text-ink",
        className
      )}
    >
      <span className="mr-0.5 font-light">₹</span>
      {formatted}
      {currency !== "INR" && <span className="ml-1 text-xs">{currency}</span>}
    </span>
  );
}

Price.propTypes = {
  amount: PropTypes.number.isRequired,
  currency: PropTypes.string,
  className: PropTypes.string,
  tone: PropTypes.oneOf(["ink", "wine"]),
};

export { formatter };
