"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Italic, Link as LinkIcon, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fieldClass, areaClass } from "./admin-ui";

type Format = "rich_text" | "markdown" | "html";

export function ContentEditor({ initialBody = "", initialFormat = "markdown" }: { initialBody?: string; initialFormat?: Format }) {
  const [body, setBody] = useState(initialBody);
  const [format, setFormat] = useState<Format>(initialFormat);
  const [activeTab, setActiveTab] = useState("edit");
  const richRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (format !== "rich_text" || !richRef.current) return;
    const documentFragment = new DOMParser().parseFromString(initialBody, "text/html");
    documentFragment.querySelectorAll("script,style,iframe,object,embed").forEach((node) => node.remove());
    documentFragment.querySelectorAll("*").forEach((node) => {
      for (const attribute of Array.from(node.attributes)) {
        if (attribute.name.startsWith("on") || /javascript:/i.test(attribute.value)) node.removeAttribute(attribute.name);
      }
    });
    richRef.current.innerHTML = documentFragment.body.innerHTML;
  }, [format, initialBody]);

  function command(name: string, value?: string) {
    richRef.current?.focus();
    document.execCommand(name, false, value);
    setBody(richRef.current?.innerHTML ?? "");
  }

  return <div className="space-y-3">
    <label className="text-text grid gap-1.5 text-sm font-medium">Format de l’éditeur
      <select name="format" value={format} onChange={(event) => setFormat(event.target.value as Format)} className={fieldClass}>
        <option value="rich_text">Texte enrichi</option><option value="markdown">Markdown</option><option value="html">HTML</option>
      </select>
    </label>
    <input type="hidden" name="body" value={body} />
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="edit" onClick={() => setActiveTab("edit")}>Modifier</TabsTrigger>
        <TabsTrigger value="preview" onClick={() => setActiveTab("preview")}>Aperçu</TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="mt-3">
        {format === "rich_text" ? <div className="border-border overflow-hidden rounded-md border">
          <div className="border-border bg-elevated flex gap-1 border-b p-2">
            <button type="button" onClick={() => command("bold")} aria-label="Gras" className="hover:bg-surface rounded p-2"><Bold className="size-4" /></button>
            <button type="button" onClick={() => command("italic")} aria-label="Italique" className="hover:bg-surface rounded p-2"><Italic className="size-4" /></button>
            <button type="button" onClick={() => command("insertUnorderedList")} aria-label="Liste à puces" className="hover:bg-surface rounded p-2"><List className="size-4" /></button>
            <button type="button" onClick={() => { const url = window.prompt("URL"); if (url) command("createLink", url); }} aria-label="Lien" className="hover:bg-surface rounded p-2"><LinkIcon className="size-4" /></button>
          </div>
          <div ref={richRef} contentEditable suppressContentEditableWarning onInput={(event) => setBody(event.currentTarget.innerHTML)} className="bg-surface min-h-72 p-4 text-sm focus:outline-none" />
        </div> : <textarea value={body} onChange={(event) => setBody(event.target.value)} className={`${areaClass} min-h-80 font-mono`} spellCheck={format !== "html"} />}
      </TabsContent>
      <TabsContent value="preview" className="mt-3">
        <div className="border-border bg-surface min-h-80 rounded-md border p-6">
          {format === "markdown" ? <div className="prose max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown></div> : <iframe title="Aperçu du contenu" sandbox="" srcDoc={body} className="min-h-72 w-full border-0" />}
        </div>
      </TabsContent>
    </Tabs>
  </div>;
}
