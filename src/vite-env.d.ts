// Declaration for CSS modules and plain CSS imports in TypeScript
declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}
