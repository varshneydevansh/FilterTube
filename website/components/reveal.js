export function Reveal({
  as: Component = "div",
  children,
  className = "",
}) {
  return (
    <Component className={className} data-reveal="true">
      {children}
    </Component>
  );
}
