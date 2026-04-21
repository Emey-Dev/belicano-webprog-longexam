import { Link } from "react-router-dom";

const variantClasses = {
  primary: "bg-blue-950 text-white hover:bg-black hover:border-black",
  secondary: "bg-white text-blue-950 hover:bg-gray-100 hover:border-blue-950",
};

const Button = ({
  children,
  to,
  type = "button",
  variant = "primary",
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full border-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg";

  const classes = [
    baseClasses,
    "border-black",
    variantClasses[variant] ?? variantClasses.primary,
    className,
  ]
    .join(" ")
    .trim();

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes}>
      {children}
    </button>
  );
};

export default Button;