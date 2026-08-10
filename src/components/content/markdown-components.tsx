import type { Components } from "react-markdown";

/**
 * Shared renderer overrides for CMS Markdown.
 *
 * A Markdown table has no wrapper of its own, so a wide one — the processor
 * list in the privacy policy, the shipping tariffs — had nothing to scroll
 * inside and stretched the whole page instead: a 375px phone was rendering at
 * 752px, with a band of white to the right of every section. Wrapping it here
 * keeps the table a real table, which is what holds the columns aligned, and
 * puts the overflow on a box that can actually take it.
 */
export const markdownComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="table-scroll">
      <table {...props}>{children}</table>
    </div>
  ),
};
